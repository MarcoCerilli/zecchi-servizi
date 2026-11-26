import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/ai/',      // Evitiamo che i bot leggano le rotte della tua AI
        '/private/', // Altre eventuali rotte private
      ],
    },
    sitemap: 'https://www.zecchiserviziterracina.it/sitemap.xml',
  }
}