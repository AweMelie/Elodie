// utils/registerProcessHandlers.js
module.exports = () => {
  process.on('unhandledRejection', err => {
    if (
      err.code === 40060 ||
      err.code === 10062 ||
      err.message?.includes('Interaction has already been acknowledged')
    ) {
      console.warn('⚠️ Autocomplete interaction issue silently ignored.');
      return;
    }
    console.error('🔥 Unhandled rejection:', err);
  });
};