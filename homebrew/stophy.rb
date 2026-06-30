class Stophy < Formula
  desc "Stophy CLI - YouTube data for AI agents and developers"
  homepage "https://stophy.dev"
  version "1.0.8"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/stophydotdev/cli/releases/download/v#{version}/stophy-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/stophydotdev/cli/releases/download/v#{version}/stophy-darwin-x64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end
  on_linux do
    on_arm do
      url "https://github.com/stophydotdev/cli/releases/download/v#{version}/stophy-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/stophydotdev/cli/releases/download/v#{version}/stophy-linux-x64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    if OS.mac?
      if Hardware::CPU.arm?
        bin.install "stophy-darwin-arm64" => "stophy"
      else
        bin.install "stophy-darwin-x64" => "stophy"
      end
    elsif OS.linux?
      if Hardware::CPU.arm?
        bin.install "stophy-linux-arm64" => "stophy"
      else
        bin.install "stophy-linux-x64" => "stophy"
      end
    end
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/stophy --version")
  end
end
