export interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

export async function lookupWord(word: string): Promise<DictionaryResult | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    return {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
      meanings: entry.meanings.map((m: any) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map((d: any) => ({
          definition: d.definition,
          example: d.example,
        })),
      })),
    };
  } catch {
    return null;
  }
}
