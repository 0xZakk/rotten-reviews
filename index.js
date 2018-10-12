const Axios = require('axios').default
const cheerio = require('cheerio')

const reviewsPerPage = 20;
module.exports = {
  getAudienceReviews: (slug, count) => {
    const movieUrl = (slug, pages) =>
      `https://www.rottentomatoes.com/m/${slug}/reviews/?page=${pages}&type=user&sort=`

    const pages = Math.ceil(count/reviewsPerPage);

    return new Promise(resolve => {
      const pageRequests = []
      for (let i = 0; i < pages; i++) {
        pageRequests.push(Axios.get(movieUrl(slug, i + 1)))
      }
      resolve(pageRequests)
    })
      .then(pageRequests => Axios.all(pageRequests))
      .then(
        Axios.spread((...requests) => {
          const reviews = []
          requests.forEach(request => {
            reviews.push.apply(reviews, module.exports.scrapePage(request.data))
          })
          return reviews.slice(0, count);
        })
      )
  },
  scrapePage: data => {
    const $ = cheerio.load(data)
    const reviews = []

    $('.review_table_row').each((i, element) => {
      const stars = $(element).find('.glyphicon.glyphicon-star').length
      const hasHalf = $(element).find('span:contains("½")').length ? 0.5 : 0

      const [reviewer, date, review] = [
        '.bold.unstyled.articleLink',
        '.fr.small.subtle',
        '.user_review',
      ].map(classes =>
        $(element)
          .find(classes)
          .text()
          .trim()
      )

      reviews.push({
        reviewer: reviewer,
        date: date,
        stars: stars + hasHalf,
        review: review,
      })
    })

    return reviews
  },
}
