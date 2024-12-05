furitar = JmdictFurigana.json.tar.gz
jmdict = JMdict_e

JmdictFurigana.sqlite:
		time node make.js furiidx download/JmdictFurigana.json JmdictFurigana.sqlite
download/JmdictFurigana.json:
		tar -xzf download/$(furitar) -C download
download/$(furitar):
		wget -O download/$(furitar) https://github.com/Doublevil/JmdictFurigana/releases/download/2.3.1%2B2024-11-25/$(furitar)
download/$(jmdict):
		wget -O download/$(jmdict).gz http://ftp.edrdg.org/pub/Nihongo/$(jmdict).gz
		gunzip download/$(jmdict).gz

clean:
		rm JmdictFurigana.sqlite