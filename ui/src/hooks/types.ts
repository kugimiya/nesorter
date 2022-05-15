export type ScannedItem = {
  path: string,
  name: string,
  size: number,
  isDir: boolean,
  isFile: boolean
};

export type ClassificationCategory = {
  name: string;
  values: string[];
}

export type Chain = Record<string, {
  type: 'file' | 'dir',
  name: string,
  key: string,
  link: string | null,
  meta?: ScannedItem
}>;