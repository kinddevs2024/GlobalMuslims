async function safeEditMessageText(ctx, text, extra) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (error) {
    const isNotModifiedError =
      typeof error.message === 'string' &&
      error.message.includes('message is not modified');

    if (!isNotModifiedError) {
      throw error;
    }
  }
}

function getTelegramIdentity(from) {
  return {
    telegramId: String(from.id),
    username: from.username || null
  };
}

module.exports = {
  safeEditMessageText,
  getTelegramIdentity
};
