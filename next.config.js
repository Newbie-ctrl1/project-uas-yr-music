/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'awsimages.detik.net.id',
      },
      {
        protocol: 'https',
        hostname: 'akcdn.detik.net.id',
      },
      {
        protocol: 'https',
        hostname: 'assets.kompasiana.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn0-production-images-kly.akamaized.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn1-production-images-kly.akamaized.net',
      },
      {
        protocol: 'https',
        hostname: 'asset.kompas.com',
      },
      {
        protocol: 'https',
        hostname: 'asset-a.grid.id',
      },
      {
        protocol: 'https',
        hostname: 'media.suara.com',
      },
      {
        protocol: 'https',
        hostname: 'www.rollingstone.com',
      },
      {
        protocol: 'https',
        hostname: 'www.billboard.com',
      },
      {
        protocol: 'https',
        hostname: 'pitchfork.com',
      },
      {
        protocol: 'https',
        hostname: 'media.pitchfork.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      }
    ]
  }
}

module.exports = nextConfig