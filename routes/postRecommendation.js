const express = require("express");
const router = express.Router();
const prisma = require("../config/prismaDb");
const natural = require('natural');
const levenshtein = require('js-levenshtein');
const jaccardIndex = require('jaccard-index');

function stemDocument(document) {
  const tokenizer = new natural.WordTokenizer();
  const stemmer = natural.PorterStemmer; // Or any other stemmer provided by natural

  // Tokenize the document into words
  const tokens = tokenizer.tokenize(document.toLowerCase());

  // Stem each token and join them back into a stemmed document
  const stemmedDocument = tokens.map((word) => stemmer.stem(word)).join(" ");
  console.log("Stemmed Document:", stemmedDocument); // Debug: Check the stemmed document
  return stemmedDocument;
}

// Function to normalize vector
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val ** 2, 0));
  return vector.map((val) => val / magnitude);
}

// Function to expand words with synonyms using wordnet
async function expandWordsWithSynonyms(words) {
  const expandedWords = [];
  var wordnet = new natural.WordNet();

  for (const word of words) {
    try {
      const synsets = await new Promise((resolve, reject) => {
        wordnet.lookup(word, (err, definitions) => {
          if (err) reject(err);
          resolve(definitions);
        });
      });

      if (synsets && synsets.length > 0) {
        const synonyms = synsets[0].synonyms;
        expandedWords.push(word, ...synonyms);
      } else {
        expandedWords.push(word);
      }
    } catch (error) {
      console.error(`Error finding synonyms for "${word}":`, error);
      expandedWords.push(word); // If error occurs, add the original word
    }
  }
  console.log("Expanded Words with Synonyms:", expandedWords); // Debug: Check the expanded words
  return expandedWords;
}

// Function to calculate cosine similarity between two vectors
const cosineSimilarity1 = (vec1, vec2) => {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val ** 2, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val ** 2, 0));
  // Prevent division by zero (if magnitudes are zero)
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
};

// Function to calculate similarity metrics
function calculateSimilarityWithMetrics(searchVector, postVector) {
  const cosineSimilarity = cosineSimilarity1(searchVector, postVector);
  const jaccardSimilarity = jaccardIndex(searchVector, postVector);
  const levenshteinDistance = levenshtein(searchVector.join(" "), postVector.join(" "));

  return {
    cosineSimilarity,
    jaccardSimilarity,
    levenshteinDistance,
  };
}

// Route to vectorize posts using TF-IDF and Snowball stemming
router.post("/vectorize", async (req, res) => {
  try {
    // Fetch all posts from Prisma
    const posts = await prisma.post.findMany();
    console.log("Fetched Posts:", posts.length); // Debug: Check the number of fetched posts

    // Initialize TF-IDF instance
    const tfidf = new natural.TfIdf();

    // Add stemmed documents (post content) to TF-IDF instance
    posts.forEach((post) => {
      const stemmedContent = stemDocument(post.content);
      tfidf.addDocument(stemmedContent);
    });

    // Calculate TF-IDF vectors and normalize them
    for (let i = 0; i < posts.length; i++) {
      const vector = [];
      tfidf.listTerms(i).forEach((item) => vector.push(item.tfidf));
      const normalizedVector = normalizeVector(vector);

      // Upsert vector into postVector table using Prisma
      await prisma.postVector.upsert({
        where: { postId: posts[i].postId },
        update: { vector: normalizedVector },
        create: { postId: posts[i].postId, vector: normalizedVector },
      });

      console.log(`Processed Post ID: ${posts[i].postId}`); // Debug: Check processed post IDs
    }

    res.status(200).send("Post vectors stored and normalized successfully");
  } catch (err) {
    console.error("Error storing post vectors:", err);
    res.status(500).send("Error storing post vectors");
  }
});

// Route to recommend similar posts based on stemmed input words
router.post("/recommend", async (req, res) => {
  const { words } = req.body;

  // Validate input
  if (!words || words.length === 0) {
    return res.status(400).send("Please provide a list of words");
  }

  // Expand input words with synonyms
  const expandedWords = await expandWordsWithSynonyms(words);

  // Initialize TF-IDF instance and add stemmed input words
  const tfidf = new natural.TfIdf();
  expandedWords.forEach((word) => tfidf.addDocument(stemDocument(word)));

  // Extract TF-IDF weights for expanded input words
  const searchVector = [];
  tfidf.listTerms(0).forEach((item) => searchVector.push(item.tfidf));
  console.log("Search Vector:", searchVector); // Debug: Check the search vector

  try {
    // Fetch post vectors and filter based on similarity
    const allVectors = await prisma.postVector.findMany({
      select: { postId: true, vector: true },
    });
    console.log("Fetched Post Vectors:", allVectors.length); // Debug: Check the number of fetched post vectors

    const filteredPosts = allVectors
      .map((postVector) => ({
        postId: postVector.postId,
        vector: postVector.vector,
        similarityMetrics: calculateSimilarityWithMetrics(
          searchVector,
          postVector.vector
        ),
      }))
      .sort((a, b) => {
        // Example sorting by cosine similarity
        return (
          b.similarityMetrics.cosineSimilarity -
          a.similarityMetrics.cosineSimilarity
        );
      })
      .filter((post) => {
        // Example filtering by Jaccard similarity
        return post.similarityMetrics.jaccardSimilarity > 0.5;
      })
      .slice(0, 10); // Adjust limit as needed

    console.log("Filtered Posts:", filteredPosts.length); // Debug: Check the number of filtered posts

    // Retrieve post details for filtered posts
    const postDetails = await Promise.all(
      filteredPosts.map(async (post) => {
        const postData = await prisma.post.findUnique({
          where: { postId: post.postId },
          select: { title: true, content: true },
        });

        if (!postData) return null;

        const postTokens = new natural.WordTokenizer().tokenize(postData.content.toLowerCase());
        const inputTokens = new natural.WordTokenizer().tokenize(expandedWords.join(" ").toLowerCase());
        const hasMatchingWord = inputTokens.some((token) => postTokens.includes(token));

        return {
          title: postData.title,
          id: post.postId,
          similarityMetrics: post.similarityMetrics,
          hasMatchingWord,
        };
      })
    );

    console.log("Post Details:", postDetails); // Debug: Check the post details

    // Sort by hasMatchingWord (true first), then by similarity (high to low)
    postDetails.sort((a, b) => {
      if (b.hasMatchingWord && !a.hasMatchingWord) return 1;
      if (a.hasMatchingWord && !b.hasMatchingWord) return -1;
      return (
        b.similarityMetrics.cosineSimilarity -
        a.similarityMetrics.cosineSimilarity
      );
    });

    res.json(postDetails.slice(0, 5)); // Limit to top 5 posts
  } catch (err) {
    console.error("Error retrieving similar posts:", err);
    res.status(500).send("Error retrieving similar posts");
  }
});

module.exports = router;
