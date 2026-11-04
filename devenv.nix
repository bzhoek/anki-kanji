{ pkgs, ... }:

{
  packages = with pkgs; [
    sqlite
    wget
    libxml2
    google-cloud-sdk
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    npm.enable = true;
  };

  # node-gyp fallback when prebuilt sqlite3/node-sass binaries are unavailable
  languages.python.enable = true;

  enterTest = ''
    npm test
  '';
}
