import glob from 'glob-promise';

export default async (pattern) => {
  const files = await glob(pattern); // get all
  files.sort((str1, str2) => (str2 || '').localeCompare(str1));
  return files;
};
