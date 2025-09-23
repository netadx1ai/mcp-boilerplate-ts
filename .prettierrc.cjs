module.exports = {
  // Core formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Line length and wrapping
  printWidth: 100,
  proseWrap: 'preserve',
  
  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // End of line
  endOfLine: 'lf',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: ['package.json', 'package-lock.json'],
      options: {
        tabWidth: 2,
        printWidth: 120
      }
    },
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
        printWidth: 100,
        tabWidth: 2
      }
    },
    {
      files: '*.js',
      options: {
        parser: 'babel',
        printWidth: 100,
        tabWidth: 2
      }
    }
  ]
};