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

  # sqlite3 has no prebuilt binary here, and its bundled node-gyp 8 needs distutils, which setuptools shims on Python 3.12+
  languages.python = {
    enable = true;
    package = pkgs.python3.withPackages (ps: [ ps.setuptools ]);
  };

  enterTest = ''
    npm test
  '';
}
