import { Link, useLocation } from 'react-router-dom'

function Breadcrumbs({ group }) {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  const getBreadcrumbs = () => {
    const breadcrumbs = []
    let path = ''

    // Always start with home
    breadcrumbs.push({
      name: '🏠 Home',
      path: '/'
    })

    // Add group if available
    if (group) {
      breadcrumbs.push({
        name: `📋 ${group.name}`,
        path: `/group/${group.id}`
      })
    }

    // Add current page
    const lastSegment = pathSegments[pathSegments.length - 1]
    if (lastSegment && lastSegment !== group?.id) {
      const name = {
        'submit': '✏️ Submit Predictions',
        'review': '👀 Review Predictions',
        'card': '🎲 Bingo Card'
      }[lastSegment] || lastSegment

      breadcrumbs.push({
        name,
        path: location.pathname
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <nav className="mb-4">
      <ol className="flex flex-wrap items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-yellow-500 animate-pulse">★</span>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
                {crumb.name}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-blue-600 hover:text-blue-800 cursor-retro"
              >
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs 