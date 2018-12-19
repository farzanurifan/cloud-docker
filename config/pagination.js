const pageItem = 10 // Items per page on table

module.exports = {
    pagination: (results, page) => {
        var pages = Math.ceil(results / pageItem)
        let first = 2
        let last = 9
        if (pages <= 11) {
            last = pages - 1
        }
        else if (page > 6 && !(page > pages - 6)) {
            first = page - 3
            last = page + 3
        }
        else if (page > pages - 6) {
            first = pages - 8
            last = pages - 1
        }
        return { pages, first, last }
    }
}