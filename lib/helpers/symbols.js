const isWin32 = process.platform === 'win32';

module.exports = {
    okSymbol: isWin32 ? '[OK]' : '✓',
    errorSymbol: isWin32 ? '[ERR]' : '✗',
};
