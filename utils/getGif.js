const TENOR_API_KEY = 'AIzaSyAtPQDkv9DrQ485OWwjf7bYxhZjcLThJbA'; // use your actual key here

async function getGif(searchTerm = 'anime hug') {
  const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=10&random=true`;

  try {
    const res = await fetch(url); // native fetch for Node 22 — nice!
    const data = await res.json();

    if (data.results?.length > 0) {
      const randomResult = data.results[Math.floor(Math.random() * data.results.length)];
      return randomResult.media_formats?.gif?.url || null;
    }

    return null;
  } catch (err) {
    console.error('Tenor GIF fetch failed:', err);
    return null;
  }
}

module.exports = getGif;
