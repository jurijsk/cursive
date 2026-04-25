export type Dialect = 'palestinian' | 'lebanese';

export interface LetterPronunciation {
	ipa: string;
	description: string;
	englishExamples: string[];
}

export interface LetterInfo {
	char: string;
	name: string;
	arabicName: string;
	forms: {
		isolated: string;
		initial: string;
		medial: string;
		final: string;
	};
	transliteration: string[];
	pronunciation: Record<Dialect, LetterPronunciation>;
}

// Letters that don't connect to the following letter only have isolated/final forms.
// In that case, "initial" is set equal to "isolated" and "medial" equal to "final".
export const letters: Record<string, LetterInfo> = {
	'ا': {
		char: 'ا',
		name: 'alif',
		arabicName: 'ألف',
		forms: { isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا' },
		transliteration: ['a', 'ā', 'aa'],
		pronunciation: {
			palestinian: { ipa: '/aː/', description: 'Long "ah" sound; also acts as a carrier for hamza.', englishExamples: ['father', 'calm', 'spa'] },
			lebanese: { ipa: '/aː/', description: 'Long "ah" sound; often slightly fronted toward "æ" in Lebanese speech.', englishExamples: ['father', 'cat', 'apple'] }
		}
	},
	'ب': {
		char: 'ب',
		name: 'baa',
		arabicName: 'باء',
		forms: { isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
		transliteration: ['b'],
		pronunciation: {
			palestinian: { ipa: '/b/', description: 'Like English "b".', englishExamples: ['boy', 'cab', 'rabbit'] },
			lebanese: { ipa: '/b/', description: 'Like English "b".', englishExamples: ['boy', 'cab', 'rabbit'] }
		}
	},
	'ت': {
		char: 'ت',
		name: 'taa',
		arabicName: 'تاء',
		forms: { isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
		transliteration: ['t'],
		pronunciation: {
			palestinian: { ipa: '/t/', description: 'Like English "t" but unaspirated (no puff of air).', englishExamples: ['stop', 'cat'] },
			lebanese: { ipa: '/t/', description: 'Like English "t" but unaspirated.', englishExamples: ['stop', 'cat'] }
		}
	},
	'ث': {
		char: 'ث',
		name: 'thaa',
		arabicName: 'ثاء',
		forms: { isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
		transliteration: ['th', 't', 's'],
		pronunciation: {
			palestinian: { ipa: '/t/ or /s/', description: 'In Palestinian, usually merged with ت (/t/) in everyday speech, or with س (/s/) in loanwords from MSA. The classical /θ/ ("th" in "think") is rare colloquially.', englishExamples: ['think (classical)', 'top (colloquial /t/)'] },
			lebanese: { ipa: '/t/ or /s/', description: 'In Lebanese, usually merged with ت (/t/) in everyday speech, or with س (/s/) in MSA-influenced words.', englishExamples: ['think (classical)', 'top (colloquial /t/)'] }
		}
	},
	'ج': {
		char: 'ج',
		name: 'jiim',
		arabicName: 'جيم',
		forms: { isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
		transliteration: ['j', 'zh', 'g'],
		pronunciation: {
			palestinian: { ipa: '/ʒ/', description: '"Zh" sound, like the "s" in "measure". Some rural areas use /dʒ/ ("j" in "judge").', englishExamples: ['measure', 'pleasure', 'beige'] },
			lebanese: { ipa: '/ʒ/', description: '"Zh" sound, like the "s" in "measure".', englishExamples: ['measure', 'pleasure', 'beige'] }
		}
	},
	'ح': {
		char: 'ح',
		name: 'Haa',
		arabicName: 'حاء',
		forms: { isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
		transliteration: ['H', 'ḥ', '7'],
		pronunciation: {
			palestinian: { ipa: '/ħ/', description: 'Voiceless pharyngeal fricative — a "heavy", breathy "h" produced by tightening the throat. No English equivalent.', englishExamples: ['(no direct equivalent — like a strained whisper of "h")'] },
			lebanese: { ipa: '/ħ/', description: 'Voiceless pharyngeal fricative — a "heavy", breathy "h" from the throat. No English equivalent.', englishExamples: ['(no direct equivalent — like a strained whisper of "h")'] }
		}
	},
	'خ': {
		char: 'خ',
		name: 'khaa',
		arabicName: 'خاء',
		forms: { isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
		transliteration: ['kh', 'x', 'ḵ'],
		pronunciation: {
			palestinian: { ipa: '/x/', description: 'Like the "ch" in Scottish "loch" or German "Bach" — a raspy back-of-throat sound.', englishExamples: ['loch (Scottish)', 'Bach (German)'] },
			lebanese: { ipa: '/x/', description: 'Like the "ch" in Scottish "loch" or German "Bach".', englishExamples: ['loch (Scottish)', 'Bach (German)'] }
		}
	},
	'د': {
		char: 'د',
		name: 'daal',
		arabicName: 'دال',
		forms: { isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
		transliteration: ['d'],
		pronunciation: {
			palestinian: { ipa: '/d/', description: 'Like English "d".', englishExamples: ['dog', 'mad'] },
			lebanese: { ipa: '/d/', description: 'Like English "d".', englishExamples: ['dog', 'mad'] }
		}
	},
	'ذ': {
		char: 'ذ',
		name: 'dhaal',
		arabicName: 'ذال',
		forms: { isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
		transliteration: ['dh', 'd', 'z'],
		pronunciation: {
			palestinian: { ipa: '/d/ or /z/', description: 'Usually merged with د (/d/) colloquially, or with ز (/z/) in MSA-influenced words. The classical /ð/ ("th" in "this") is rare colloquially.', englishExamples: ['this (classical)', 'do (colloquial /d/)'] },
			lebanese: { ipa: '/d/ or /z/', description: 'Usually merged with د (/d/) colloquially, or with ز (/z/) in MSA-influenced words.', englishExamples: ['this (classical)', 'do (colloquial /d/)'] }
		}
	},
	'ر': {
		char: 'ر',
		name: 'raa',
		arabicName: 'راء',
		forms: { isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
		transliteration: ['r'],
		pronunciation: {
			palestinian: { ipa: '/r/', description: 'A flapped or trilled "r", like Spanish or Italian "r".', englishExamples: ['(no English equivalent — like Spanish "pero")'] },
			lebanese: { ipa: '/r/', description: 'A flapped or trilled "r", like Spanish or Italian "r".', englishExamples: ['(no English equivalent — like Spanish "pero")'] }
		}
	},
	'ز': {
		char: 'ز',
		name: 'zay',
		arabicName: 'زاي',
		forms: { isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
		transliteration: ['z'],
		pronunciation: {
			palestinian: { ipa: '/z/', description: 'Like English "z".', englishExamples: ['zoo', 'buzz'] },
			lebanese: { ipa: '/z/', description: 'Like English "z".', englishExamples: ['zoo', 'buzz'] }
		}
	},
	'س': {
		char: 'س',
		name: 'siin',
		arabicName: 'سين',
		forms: { isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
		transliteration: ['s'],
		pronunciation: {
			palestinian: { ipa: '/s/', description: 'Like English "s".', englishExamples: ['sun', 'kiss'] },
			lebanese: { ipa: '/s/', description: 'Like English "s".', englishExamples: ['sun', 'kiss'] }
		}
	},
	'ش': {
		char: 'ش',
		name: 'shiin',
		arabicName: 'شين',
		forms: { isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش' },
		transliteration: ['sh', 'š'],
		pronunciation: {
			palestinian: { ipa: '/ʃ/', description: 'Like English "sh".', englishExamples: ['shop', 'fish'] },
			lebanese: { ipa: '/ʃ/', description: 'Like English "sh".', englishExamples: ['shop', 'fish'] }
		}
	},
	'ص': {
		char: 'ص',
		name: 'Saad',
		arabicName: 'صاد',
		forms: { isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
		transliteration: ['S', 'ṣ', '9'],
		pronunciation: {
			palestinian: { ipa: '/sˤ/', description: 'Emphatic "s" — pronounced with the back of the tongue raised, giving surrounding vowels a darker, deeper quality.', englishExamples: ['(no equivalent — "s" with a darker, hollower vowel)'] },
			lebanese: { ipa: '/sˤ/', description: 'Emphatic "s" with the back of the tongue raised.', englishExamples: ['(no equivalent — "s" with a darker, hollower vowel)'] }
		}
	},
	'ض': {
		char: 'ض',
		name: 'Daad',
		arabicName: 'ضاد',
		forms: { isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
		transliteration: ['D', 'ḍ'],
		pronunciation: {
			palestinian: { ipa: '/dˤ/', description: 'Emphatic "d" — pronounced with the back of the tongue raised; vowels around it sound darker.', englishExamples: ['(no equivalent — "d" with a darker, hollower vowel)'] },
			lebanese: { ipa: '/dˤ/', description: 'Emphatic "d" with the back of the tongue raised.', englishExamples: ['(no equivalent — "d" with a darker, hollower vowel)'] }
		}
	},
	'ط': {
		char: 'ط',
		name: 'Taa',
		arabicName: 'طاء',
		forms: { isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
		transliteration: ['T', 'ṭ', '6'],
		pronunciation: {
			palestinian: { ipa: '/tˤ/', description: 'Emphatic "t" — pronounced with the back of the tongue raised; surrounding vowels become darker.', englishExamples: ['(no equivalent — "t" with a darker, hollower vowel)'] },
			lebanese: { ipa: '/tˤ/', description: 'Emphatic "t" with the back of the tongue raised.', englishExamples: ['(no equivalent — "t" with a darker, hollower vowel)'] }
		}
	},
	'ظ': {
		char: 'ظ',
		name: 'Zaa',
		arabicName: 'ظاء',
		forms: { isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ' },
		transliteration: ['Z', 'ẓ', 'DH'],
		pronunciation: {
			palestinian: { ipa: '/zˤ/', description: 'Usually pronounced as an emphatic "z" colloquially. Classically /ðˤ/ (emphatic "th" in "this").', englishExamples: ['(no equivalent — emphatic "z")'] },
			lebanese: { ipa: '/zˤ/', description: 'Usually pronounced as an emphatic "z" colloquially.', englishExamples: ['(no equivalent — emphatic "z")'] }
		}
	},
	'ع': {
		char: 'ع',
		name: 'ayn',
		arabicName: 'عين',
		forms: { isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع' },
		transliteration: ['3', "'", 'ʿ'],
		pronunciation: {
			palestinian: { ipa: '/ʕ/', description: 'Voiced pharyngeal fricative — produced by constricting the throat as if starting to gag, then voicing. Has no English equivalent and is distinctive in Arabic.', englishExamples: ['(no English equivalent)'] },
			lebanese: { ipa: '/ʕ/', description: 'Voiced pharyngeal fricative — a deep throat sound with voicing.', englishExamples: ['(no English equivalent)'] }
		}
	},
	'غ': {
		char: 'غ',
		name: 'ghayn',
		arabicName: 'غين',
		forms: { isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
		transliteration: ['gh', 'ġ'],
		pronunciation: {
			palestinian: { ipa: '/ɣ/', description: 'Like a French "r" in "Paris" — a voiced version of خ.', englishExamples: ['(no equivalent — like French "Paris")'] },
			lebanese: { ipa: '/ɣ/', description: 'Like a French "r" in "Paris" — a gargling sound.', englishExamples: ['(no equivalent — like French "Paris")'] }
		}
	},
	'ف': {
		char: 'ف',
		name: 'faa',
		arabicName: 'فاء',
		forms: { isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
		transliteration: ['f'],
		pronunciation: {
			palestinian: { ipa: '/f/', description: 'Like English "f".', englishExamples: ['fan', 'leaf'] },
			lebanese: { ipa: '/f/', description: 'Like English "f".', englishExamples: ['fan', 'leaf'] }
		}
	},
	'ق': {
		char: 'ق',
		name: 'qaaf',
		arabicName: 'قاف',
		forms: { isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
		transliteration: ['q', "'", '2', 'k'],
		pronunciation: {
			palestinian: { ipa: '/ʔ/ (urban) or /k/ (rural)', description: 'In urban Palestinian speech, pronounced as a glottal stop /ʔ/ (the catch in "uh-oh"). In rural Palestinian, often /k/ or even /g/. Classical /q/ is uvular (further back than /k/).', englishExamples: ['uh-oh (urban /ʔ/)', 'cat (rural /k/)'] },
			lebanese: { ipa: '/ʔ/', description: 'In urban Lebanese, almost always pronounced as a glottal stop /ʔ/. Some communities (e.g. Druze) preserve classical /q/.', englishExamples: ['uh-oh (the catch sound)'] }
		}
	},
	'ك': {
		char: 'ك',
		name: 'kaaf',
		arabicName: 'كاف',
		forms: { isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
		transliteration: ['k'],
		pronunciation: {
			palestinian: { ipa: '/k/', description: 'Like English "k" but unaspirated.', englishExamples: ['skip', 'back'] },
			lebanese: { ipa: '/k/', description: 'Like English "k" but unaspirated.', englishExamples: ['skip', 'back'] }
		}
	},
	'ل': {
		char: 'ل',
		name: 'laam',
		arabicName: 'لام',
		forms: { isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
		transliteration: ['l'],
		pronunciation: {
			palestinian: { ipa: '/l/', description: 'Like English "l". Becomes "darker" (velarized /lˤ/) in the word "Allah" (الله).', englishExamples: ['leaf', 'tall'] },
			lebanese: { ipa: '/l/', description: 'Like English "l". Becomes "darker" in the word "Allah".', englishExamples: ['leaf', 'tall'] }
		}
	},
	'م': {
		char: 'م',
		name: 'miim',
		arabicName: 'ميم',
		forms: { isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
		transliteration: ['m'],
		pronunciation: {
			palestinian: { ipa: '/m/', description: 'Like English "m".', englishExamples: ['man', 'home'] },
			lebanese: { ipa: '/m/', description: 'Like English "m".', englishExamples: ['man', 'home'] }
		}
	},
	'ن': {
		char: 'ن',
		name: 'nuun',
		arabicName: 'نون',
		forms: { isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
		transliteration: ['n'],
		pronunciation: {
			palestinian: { ipa: '/n/', description: 'Like English "n".', englishExamples: ['no', 'sun'] },
			lebanese: { ipa: '/n/', description: 'Like English "n".', englishExamples: ['no', 'sun'] }
		}
	},
	'ه': {
		char: 'ه',
		name: 'haa',
		arabicName: 'هاء',
		forms: { isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
		transliteration: ['h'],
		pronunciation: {
			palestinian: { ipa: '/h/', description: 'Like English "h" — pronounced even at the end of words.', englishExamples: ['hat', 'hello'] },
			lebanese: { ipa: '/h/', description: 'Like English "h"; can be lightly pronounced or omitted at word ends colloquially.', englishExamples: ['hat', 'hello'] }
		}
	},
	'و': {
		char: 'و',
		name: 'waaw',
		arabicName: 'واو',
		forms: { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
		transliteration: ['w', 'u', 'ū', 'oo', 'o'],
		pronunciation: {
			palestinian: { ipa: '/w/ or /uː/ or /oː/', description: 'As consonant: like English "w". As long vowel: like "oo" in "moon" (/uː/) or "o" in "go" (/oː/).', englishExamples: ['water (/w/)', 'moon (/uː/)', 'go (/oː/)'] },
			lebanese: { ipa: '/w/ or /uː/ or /oː/', description: 'Same range as Palestinian — consonantal "w" or long /uː/ / /oː/.', englishExamples: ['water (/w/)', 'moon (/uː/)', 'go (/oː/)'] }
		}
	},
	'ي': {
		char: 'ي',
		name: 'yaa',
		arabicName: 'ياء',
		forms: { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
		transliteration: ['y', 'i', 'ī', 'ee'],
		pronunciation: {
			palestinian: { ipa: '/j/ or /iː/ or /eː/', description: 'As consonant: like English "y". As long vowel: like "ee" in "see" (/iː/) or "ay" in "say" (/eː/).', englishExamples: ['yes (/j/)', 'see (/iː/)', 'say (/eː/)'] },
			lebanese: { ipa: '/j/ or /iː/ or /eː/', description: 'Same range as Palestinian.', englishExamples: ['yes (/j/)', 'see (/iː/)', 'say (/eː/)'] }
		}
	},
	'ء': {
		char: 'ء',
		name: 'hamza',
		arabicName: 'همزة',
		forms: { isolated: 'ء', initial: 'ء', medial: 'ء', final: 'ء' },
		transliteration: ["'", '2', 'ʾ'],
		pronunciation: {
			palestinian: { ipa: '/ʔ/', description: 'Glottal stop — the "catch" between syllables in "uh-oh".', englishExamples: ['uh-oh', 'kitten (the gap before "n")'] },
			lebanese: { ipa: '/ʔ/', description: 'Glottal stop — the "catch" sound.', englishExamples: ['uh-oh'] }
		}
	},
	'أ': {
		char: 'أ',
		name: 'alif with hamza above',
		arabicName: 'ألف بهمزة فوقها',
		forms: { isolated: 'أ', initial: 'أ', medial: 'ـأ', final: 'ـأ' },
		transliteration: ["'a", 'a', '2a'],
		pronunciation: {
			palestinian: { ipa: '/ʔa/ or /ʔ/', description: 'Hamza (glottal stop) carried on alif, usually at the start of a word with a short "a" or "u" sound.', englishExamples: ['uh-oh ah', 'apple (with a glottal onset)'] },
			lebanese: { ipa: '/ʔa/ or /ʔ/', description: 'Glottal stop on alif at the start of words.', englishExamples: ['uh-oh ah'] }
		}
	},
	'إ': {
		char: 'إ',
		name: 'alif with hamza below',
		arabicName: 'ألف بهمزة تحتها',
		forms: { isolated: 'إ', initial: 'إ', medial: 'ـإ', final: 'ـإ' },
		transliteration: ["'i", 'i', '2i'],
		pronunciation: {
			palestinian: { ipa: '/ʔi/', description: 'Hamza on alif with a short "i" sound; appears at the start of words.', englishExamples: ['it (with a glottal onset)'] },
			lebanese: { ipa: '/ʔi/', description: 'Hamza on alif with a short "i" sound.', englishExamples: ['it (with a glottal onset)'] }
		}
	},
	'ؤ': {
		char: 'ؤ',
		name: 'waaw with hamza',
		arabicName: 'واو بهمزة',
		forms: { isolated: 'ؤ', initial: 'ؤ', medial: 'ـؤ', final: 'ـؤ' },
		transliteration: ["'u", 'u', "'"],
		pronunciation: {
			palestinian: { ipa: '/ʔ/', description: 'Hamza carried on waaw — the waaw is just a chair, the sound is glottal stop.', englishExamples: ['uh-oh'] },
			lebanese: { ipa: '/ʔ/', description: 'Hamza on waaw chair — glottal stop.', englishExamples: ['uh-oh'] }
		}
	},
	'ئ': {
		char: 'ئ',
		name: 'yaa with hamza',
		arabicName: 'ياء بهمزة',
		forms: { isolated: 'ئ', initial: 'ئـ', medial: 'ـئـ', final: 'ـئ' },
		transliteration: ["'i", "'", '2'],
		pronunciation: {
			palestinian: { ipa: '/ʔ/', description: 'Hamza carried on yaa — the yaa is a chair, the sound is glottal stop.', englishExamples: ['uh-oh'] },
			lebanese: { ipa: '/ʔ/', description: 'Hamza on yaa chair — glottal stop.', englishExamples: ['uh-oh'] }
		}
	},
	'ى': {
		char: 'ى',
		name: 'alif maqsura',
		arabicName: 'ألف مقصورة',
		forms: { isolated: 'ى', initial: 'ى', medial: 'ـى', final: 'ـى' },
		transliteration: ['a', 'á', 'aa'],
		pronunciation: {
			palestinian: { ipa: '/aː/', description: '"Dotless yaa" — at word end, sounds like a long "ah". Functions as alif in pronunciation but is written as a yaa-shape.', englishExamples: ['father', 'spa'] },
			lebanese: { ipa: '/aː/', description: '"Dotless yaa" — at word end, sounds like a long "ah".', englishExamples: ['father'] }
		}
	},
	'ة': {
		char: 'ة',
		name: 'taa marbuta',
		arabicName: 'تاء مربوطة',
		forms: { isolated: 'ة', initial: 'ة', medial: 'ـة', final: 'ـة' },
		transliteration: ['a', 'h', 'at', 'eh'],
		pronunciation: {
			palestinian: { ipa: '/a/ or /e/', description: 'Feminine word ending. In standalone speech, pronounced as a short "a" or "e". When followed by another word in construct, becomes /t/.', englishExamples: ['(short "a" — like "the" before consonant)'] },
			lebanese: { ipa: '/e/', description: 'Feminine word ending, typically pronounced as a short "e" in Lebanese.', englishExamples: ['(short "e" — like "bed" without final d)'] }
		}
	}
};

export function getLetterInfo(char: string): LetterInfo | null {
	return letters[char] ?? null;
}
