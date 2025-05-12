interface DatsanPickleBallAboutProps {
  title: string;
  ratingStars: number;
  description?: string;
  imageUrl?: string;
}

const DatsanPickleBallAbout: React.FC<DatsanPickleBallAboutProps> = ({
  title,
  ratingStars,
  description,
  imageUrl,
}) => {
  return (
    <div className="text-center p-4 md:p-8">
      <h2 className="text-xl font-semibold mb-2 md:text-2xl lg:text-3xl">
        {title}
      </h2>

      <div className="flex justify-center mb-2 md:mb-3">
        {Array.from({ length: ratingStars }).map((_, index) => (
          <span
            key={index}
            className="text-yellow-500 text-lg md:text-xl lg:text-2xl"
          >
            ★
          </span>
        ))}
      </div>

      {description && (
        <div
          className="mb-3 md:mb-4 text-left px-4 md:px-8 lg:px-16 
                 text-sm md:text-base lg:text-lg"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {imageUrl && (
        <div className="max-w-2xl mx-auto mt-4 md:mt-6 lg:mt-8 px-4 md:px-0">
          <img
            src={imageUrl}
            alt="About DatsanPickleBall"
            className="w-full h-auto rounded-lg shadow-md"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

export default DatsanPickleBallAbout;