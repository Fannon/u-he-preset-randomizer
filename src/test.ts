import autocomplete, { Separator } from 'inquirer-autocomplete-standalone';

const answer = await autocomplete({
  message: 'Travel from what country?',
  source: async (_input) => {
    return [
      new Separator('Africa'),
      new Separator(),
      {
        value: 'Egypt',
      },
      new Separator('Europe'),
      new Separator(),
      {
        value: 'Norway',
      },
    ];
  },
});

console.log(answer)
