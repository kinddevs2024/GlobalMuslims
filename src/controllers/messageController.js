async function handleTextMessage(ctx) {
  const text = (ctx.message?.text || '').trim();

  if (!text || text.startsWith('/')) {
    return;
  }

  await ctx.reply(
    [
      'Xabaringiz qabul qilindi ✅',
      '',
      'Quyidagi buyruqlardan foydalaning:',
      '/prayer - Bugungi namozlar holati',
      '/calendar - Ramadan kalendari'
    ].join('\n')
  );
}

module.exports = {
  handleTextMessage
};
