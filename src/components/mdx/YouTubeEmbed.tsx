const isValidYouTubeId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id)

export default function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  if (!id || !isValidYouTubeId(id)) {
    return (
      <div className="my-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">▶</div>
        <p className="text-sm font-medium text-gray-700">Video placeholder</p>
        {title && (
          <p className="text-xs text-gray-500 mt-1">
            Search YouTube for: <em>"{title}"</em>
          </p>
        )}
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title ?? 'robotics')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-blue-600 hover:underline"
        >
          Find on YouTube →
        </a>
      </div>
    )
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden aspect-video bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title ?? 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}