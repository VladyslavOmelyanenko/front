import { PortableText } from "@portabletext/react";
import { urlFor } from "../lib/sanity";

// A simple image component for Sanity images
function SanityImage({ value }) {
  const ref = value?.asset?._ref || value?.asset?._id;
  if (!ref) return null;
  const src = urlFor(value).width(1200).auto("format").url();
  const alt = value?.alt || value?.caption || "";
  return <img src={src} alt={alt} loading="lazy" />;
}

// Portable Text components map
const components = {
  types: {
    image: SanityImage,
  },
  block: {
    h1: ({ children }) => <h1>{children}</h1>,
    normal: ({ children }) => <p>{children}</p>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
};

export default function PostContent({ post }) {
  return (
    <>
      {post.content && (
        <PortableText value={post.content} components={components} />
      )}
    </>
  );
}
