furijson = JmdictFurigana.json
jmdict = JMdict_e

japanese.sqlite: download/$(furijson) download/kanjidic download/$(jmdict)
		time node make.js furijson download/$(furijson) japanese.sqlite
		time node make.js kanji download/kanjidic japanese.sqlite

download/$(furijson):
		wget -O download/$(furijson) https://github.com/Doublevil/JmdictFurigana/releases/download/2.3.1%2B2024-11-25/$(furijson)
		tar -xzf download/$(furijson).tar.gz -C download

download/kanjidic:
		wget -O download/kanjidic.gz http://www.edrdg.org/kanjidic/kanjidic.gz
		gunzip download/kanjidic.gz

jmdict: jmdict.sqlite

jmdict.sqlite: download/$(jmdict)
		time node make.js kanji download/$(jmdict) jmdict.sqlite

download/$(jmdict):
		wget -O download/$(jmdict).gz http://ftp.edrdg.org/pub/Nihongo/$(jmdict).gz
		gunzip download/$(jmdict).gz

clean:
		rm japanese.sqlite
