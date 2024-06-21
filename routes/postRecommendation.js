const express = require("express");
const router = express.Router();
const util = require("util");
const prisma = require("../config/prismaDb");
const natural = require("natural");
const levenshtein = require("js-levenshtein");
const jaccardIndex = require("jaccard-index");
const { resolve } = require("path");

// Function to stem the document
function stemDocument(document) {
  const tokenizer = new natural.WordTokenizer();
  const stemmer = natural.PorterStemmer;

  const tokens = tokenizer.tokenize(document.toLowerCase());
  const stemmedDocument = tokens.map((word) => stemmer.stem(word)).join(" ");
  return stemmedDocument;
}



const expandWordsWithSynonyms = async (words) => {
  const natural = require("natural");
  const wordnet = new natural.WordNet();

  try {
    const synonymArrays = await Promise.all(
      words.map(async (word) => {
        try {
          return new Promise((resolve, reject) => {
            wordnet.lookup(word, function (results) {
              if (results.length > 0) {
                const synonyms = results[0].synonyms;
                console.log(`Synonyms for ${word}:`, synonyms);
                resolve(synonyms);
              } else {
                console.log(`No synonyms found for ${word}`);
                resolve([word]);
              }
            });
          });
        } catch (error) {
          console.error(`Error looking up word ${word}:`, error);
          return [word];
        }
      })
    );

    return synonymArrays.flat();
  } catch (error) {
    console.error("Error expanding words with synonyms:", error);
    return words;
  }
};

function normalizeVector(vec) {
  const sum = vec.reduce((acc, val) => acc + val * val, 0);
  const magnitude = Math.sqrt(Math.max(sum, Number.EPSILON));
  return magnitude === 0 ? vec.map(() => 0) : vec.map((val) => val / magnitude);
}


// Function to calculate cosine similarity
const cosineSimilarity = (vec1, vec2) => {
  try {
    // Ensure both vectors have the same length by padding the shorter vector with zeros
    const maxLength = Math.max(vec1.length, vec2.length);
    vec1 = padVector(vec1, maxLength);
    vec2 = padVector(vec2, maxLength);

    console.log(vec1.length, vec2.length)
    console.log("vec1 - ",vec1," <->","vec2 - " ,vec2)
    const normalizedVec1 = normalizeVector(vec1);
    const normalizedVec2 = normalizeVector(vec2);
  
    // Calculate dot product
    const dotProduct = normalizedVec1.reduce((sum, val, i) => sum + val * normalizedVec2[i], 0);
  
    // Handle division by zero and return cosine similarity
    const magnitude1 = Math.sqrt(normalizedVec1.reduce((sum, val) => sum + val ** 2, 0));
    const magnitude2 = Math.sqrt(normalizedVec2.reduce((sum, val) => sum + val ** 2, 0));
  

    console.log("dotProduct - ",dotProduct," <->","magintude 1 - " ,magnitude1," <->" , "magintude 2 - ", magnitude2)
    if (magnitude1 === 0 || magnitude2 === 0) {
      console.warn("One or both vectors have zero magnitude, returning default similarity (0).");
      return 0; // Return 0 for cosine similarity if either magnitude is zero
    }
  
    return dotProduct / (magnitude1 * magnitude2);
  }
  catch (error) {
    console.error('Error calculating cosine similarity:', error);
    return 0; // Return default value or handle error case
  }
};


// Function to pad vector with zeros to a specified length
const padVector = (vector, length) => {
  if (vector.length >= length) {
    return vector.slice(0, length); // Trim if longer
  } else {
    return vector.concat(new Array(length - vector.length).fill(0)); // Pad with zeros
  }
};

// Function to calculate similarity metrics
function calculateSimilarityWithMetrics(searchVector, postVector) {
  try {
    const cosineSim = cosineSimilarity(searchVector, postVector);
    const jaccardSim = jaccardIndex(searchVector, postVector); // Define jaccardIndex function
    const levenshteinDist = levenshtein(searchVector.join(" "), postVector.join(" ")); // Define levenshtein function

    return { cosineSim, jaccardSim, levenshteinDist };
  } catch (error) {
    console.error('Error calculating similarity metrics:', error);
    return { cosineSim: 0, jaccardSim: 0, levenshteinDist: Infinity }; // Return default values or handle error case
  }
}

// Route to vectorize posts using TF-IDF and stemming
router.post("/vectorize", async (req, res) => {
  try {
    const posts = await prisma.post.findMany();

    const tfidf = new natural.TfIdf();

    // Step 1: Add documents and calculate TF-IDF weights
    posts.forEach((post) => {
      const stemmedContent = stemDocument(post.content);
      tfidf.addDocument(stemmedContent);
    });

    // Step 2: Update or create TF-IDF vectors in the database
    for (let i = 0; i < posts.length; i++) {
      const terms = tfidf.listTerms(i); // Get terms and their TF-IDF weights for current document
      const tfidfVector = new Array(terms.length);

      // Step 3: Calculate TF-IDF vector for the current document
      for (let j = 0; j < terms.length; j++) {
        const { term, tfidf: weight } = terms[j];
        const tf = tfidf.tf(term, i); // Term frequency in current document
        const idf = tfidf.idf(term); // Inverse document frequency

        // Calculate TF-IDF weight for the term in the document
        tfidfVector[j] = {
          term,
          tfidf: tf * idf,
        };
      }

      // Step 4: Normalize TF-IDF vector (optional, depending on your cosine similarity implementation)
      const normalizedVector = normalizeVector(tfidfVector.map((item) => item.tfidf));

      // Step 5: Store or update TF-IDF vector in the database (using Prisma)
      await prisma.postVector.upsert({
        where: { postId: posts[i].postId },
        update: { vector: normalizedVector },
        create: { postId: posts[i].postId, vector: normalizedVector },
      });
    }

    res.status(200).send("Post vectors stored and normalized successfully");
  } catch (err) {
    console.error('Error storing post vectors:', err);
    res.status(500).send("Error storing post vectors");
  }
});

// Route to recommend similar posts based on stemmed input words
// Route to recommend similar posts based on stemmed input words
router.post("/recommend", async (req, res) => {
  const { words } = req.body;

  if (!words || words.length === 0) {
    return res.status(400).send("Please provide a list of words");
  }

  try {
    const expandedWords = await expandWordsWithSynonyms(words);
    console.log("Expanded words:", expandedWords);

    const tfidf = new natural.TfIdf();
    expandedWords.forEach((word) => {
      const stemmedWord = stemDocument(word);
      tfidf.addDocument(stemmedWord);
    });

    // Create search vector using TF-IDF weights
    const searchVector = [];
    for (let i = 0; i < tfidf.documents.length; i++) {
      const vector = tfidf.listTerms(i).map((item) => ({
        term: item.term,
        tfidf: item.tfidf,
      }));
      searchVector.push(...vector);
    }

    // Retrieve all post vectors from the database
    const allVectors = await prisma.postVector.findMany({
      select: { postId: true, vector: true },
    });

    // Calculate similarity metrics for each post vector
    const filteredPosts = allVectors.map((postVector) => ({
      postId: postVector.postId,
      vector: postVector.vector,
      similarityMetrics: {
        cosineSim: cosineSimilarity(searchVector, postVector.vector),
        jaccardSim: jaccardIndex(searchVector, postVector.vector),
        levenshteinDist: levenshtein(searchVector.map((item) => item.term).join(" "), postVector.vector.map((item) => item.term).join(" ")),
      },
    }));

    // Retrieve post details and sort by cosine similarity
    const postDetails = await Promise.all(
      filteredPosts.map(async (post) => {
        const postData = await prisma.post.findUnique({
          where: { postId: post.postId },
          select: { title: true, content: true },
        });

        if (!postData) return null;

        // Check if any expanded words match with post content tokens
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

    // Sort posts by cosine similarity and return top 5 results
    postDetails.sort((a, b) => {
      if (b.hasMatchingWord && !a.hasMatchingWord) return 1;
      if (a.hasMatchingWord && !b.hasMatchingWord) return -1;
      return b.similarityMetrics.cosineSim - a.similarityMetrics.cosineSim;
    });

    res.json(postDetails.slice(0, 5));
  } catch (err) {
    console.error('Error recommending posts:', err);
    res.status(500).send("Error retrieving similar posts");
  }
});


module.exports = router;
