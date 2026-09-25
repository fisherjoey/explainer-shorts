import type {Word} from "./schema";

export type CaptionWindow = {words: Word[]; start: number; end: number};

const PUNCT_END = /[.,;:?!—]$/;

/**
 * Groups words into caption windows. A window breaks at `maxWords`, after end punctuation, on a
 * pause over 0.6 s, at a slide change, and before a word that would take its text (words joined
 * by single spaces) past `maxChars`, so a word longer than `maxChars` sits alone.
 */
export const buildWindows = (words: Word[], maxWords = 5, maxChars = 30): CaptionWindow[] => {
  const groups: Word[][] = [];
  let current: Word[] = [];
  let chars = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (current.length === 0) {
      current.push(word);
      chars = word.text.length;
      continue;
    }
    const prev = current[current.length - 1];
    const gap = word.start - prev.end;
    const shouldBreak =
      current.length >= maxWords ||
      PUNCT_END.test(prev.text) ||
      gap > 0.6 ||
      word.slide !== prev.slide ||
      chars + 1 + word.text.length > maxChars;
    if (shouldBreak) {
      groups.push(current);
      current = [word];
      chars = word.text.length;
    } else {
      current.push(word);
      chars += 1 + word.text.length;
    }
  }
  if (current.length > 0) groups.push(current);

  return groups.map((group, i) => {
    const isLast = i === groups.length - 1;
    const end = isLast
      ? group[group.length - 1].end + 0.4
      : groups[i + 1][0].start;
    return {words: group, start: group[0].start, end};
  });
};
