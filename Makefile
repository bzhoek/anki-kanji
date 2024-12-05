furijson = JmdictFurigana.json
jmdict = JMdict_e

furigana: jmfurigana.sqlite

jmfurigana.sqlite: download/$(furijson)
		time node make.js furijson download/$(furijson) jmfurigana.sqlite

download/$(furijson):
		wget -O download/$(furijson) https://github.com/Doublevil/JmdictFurigana/releases/download/2.3.1%2B2024-11-25/$(furijson)
		tar -xzf download/$(furijson).tar.gz -C download

jmdict: jmdict.sqlite

jmdict.sqlite: download/$(jmdict)
		time node make.js kanji download/$(jmdict) jmdict.sqlite

download/$(jmdict):
		wget -O download/$(jmdict).gz http://ftp.edrdg.org/pub/Nihongo/$(jmdict).gz
		gunzip download/$(jmdict).gz

clean:
		rm jmfurigana.sqlite
