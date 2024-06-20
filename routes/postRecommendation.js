const express = require('express');
const router = express.Router();
const prisma = require('../config/prismaDb');
const natural = require('natural');


// Require the controllers WHICH WE DID NOT CREATE YET!!

function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val ** 2, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val ** 2, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  router.post('/vectorize', async (req, res) => {
    const posts = await prisma.post.findMany();
  
    const tfidf = new natural.TfIdf();
    posts.forEach(post => tfidf.addDocument(post.content));

  
    try {
      for (let i = 0; i < posts.length; i++) {
        const vector = [];
        tfidf.listTerms(i).forEach(item => vector.push(item.tfidf));
  
        // Insert or update vector using Prisma upsert
        await prisma.postVector.upsert({
          where: { postId: posts[i].postId },
          update: { vector: vector },
          create: {
            postId: posts[i].postId,
            vector: vector,
          },
        });
      }
      res.status(200).send('Post vectors stored successfully');
    } catch (err) {
      console.error('Error storing post vectors:', err);
      res.status(500).send('Error storing post vectors');
    }
  });
  
  router.post('/recommend', async (req, res) => {
    console.log(req.body);
    const { words } = req.body;
  
    if (!words || words.length === 0) {
      return res.status(400).send('Please provide a list of words');
    }
  
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(words.join(' '));
  
    const searchVector = [];
    tfidf.listTerms(0).forEach(item => searchVector.push(item.tfidf));
  
    try {
      const allVectors = await prisma.postVector.findMany();
  
      const similarities = allVectors.map(vector => ({
        postId: vector.postId,
        similarity: cosineSimilarity(searchVector, vector.vector),
      }));
  
      similarities.sort((a, b) => b.similarity - a.similarity);
  
      const similarPosts = similarities.slice(0, 5); // Top 5 similar posts
  
      const postDetails = await Promise.all(
        similarPosts.map(async similarity => {
          const post = await prisma.post.findUnique({
            where: { postId: similarity.postId },
          });
          return { ...post, similarity: similarity.similarity };
        })
      );
  
      res.json(postDetails);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error retrieving similar posts');
    }
  });



module.exports = router;