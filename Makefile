furitar = JmdictFurigana.json.tar.gz

JmdictFurigana.sqlite:
		node make.js furigana download/JmdictFurigana.json JmdictFurigana..sqlite
download/JmdictFurigana.json:
		tar -xzf download/$(furitar) -C download
download/$(furitar):
		wget -O download/$(furitar) https://github.com/Doublevil/JmdictFurigana/releases/download/2.3.1%2B2024-11-25/$(furitar)

