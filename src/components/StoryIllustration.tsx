import React from 'react';

const imageFiles = import.meta.glob('../../assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const resolveImage = (path: string): string => {
  const fileName = path.split('/').pop() || '';
  const key = Object.keys(imageFiles).find((k) => k.endsWith('/' + fileName));
  return key ? imageFiles[key] : path;
};

export interface StoryIllustrationProps {
  pageNumber: number | 'cover' | 'result';
  className?: string;
  aspectRatio?: '4/3' | '3/4' | '16/10' | '1/1';
}

const ILLUSTRATIONS: Record<string | number, { src: string; alt: string }> = {
  cover: {
    src: '/src/assets/images/cover_max_dog_1791733468460.jpg',
    alt: 'Max the brave dog wearing a red superhero cape in a sunny wildflower meadow with a cottage',
  },
  1: {
    src: '/src/assets/images/page_cat_yard_1791733481312.jpg',
    alt: 'Max the golden puppy hiding timidly behind a flowerpot while an orange cat sleeps peacefully on the fence',
  },
  2: {
    src: '/src/assets/images/page_cat_yard_1791733481312.jpg',
    alt: 'Max the golden puppy hiding timidly behind a flowerpot while an orange cat sleeps peacefully on the fence',
  },
  3: {
    src: '/src/assets/images/page_kitchen_mess_1791733494293.jpg',
    alt: 'Max the golden puppy with peanut butter all over his nose, an open jar, and an unrolled paper towel mess',
  },
  4: {
    src: '/src/assets/images/page_kitchen_mess_1791733494293.jpg',
    alt: 'Max the golden puppy with peanut butter all over his nose, an open jar, and an unrolled paper towel mess',
  },
  5: {
    src: '/src/assets/images/page_mud_splash_1791733505300.jpg',
    alt: 'Max the golden puppy joyfully leaping over a rain mud puddle splashing mud from his paws catching a red ball',
  },
  6: {
    src: '/src/assets/images/page_mud_splash_1791733505300.jpg',
    alt: 'Max the golden puppy joyfully leaping over a rain mud puddle splashing mud from his paws catching a red ball',
  },
  7: {
    src: '/src/assets/images/page_bath_wet_1791733515296.jpg',
    alt: 'Max the golden puppy soaking wet, shaking water droplets across the flooded bathroom with bubbles and a rubber duck',
  },
  8: {
    src: '/src/assets/images/page_bath_wet_1791733515296.jpg',
    alt: 'Max the golden puppy soaking wet, shaking water droplets across the flooded bathroom with bubbles and a rubber duck',
  },
  9: {
    src: '/src/assets/images/page_bed_cuddle_1791733524900.jpg',
    alt: 'Max the golden puppy and the sweet orange tabby cat curled up fast asleep nose-to-nose on a colorful patchwork quilt',
  },
  10: {
    src: '/src/assets/images/page_bed_cuddle_1791733524900.jpg',
    alt: 'Max the golden puppy and the sweet orange tabby cat curled up fast asleep nose-to-nose on a colorful patchwork quilt',
  },
  result: {
    src: '/src/assets/images/result_max_celebrate_1791733534670.jpg',
    alt: 'Max the golden puppy proudly celebrating with a shiny gold star medal and colorful confetti ribbons',
  },
};

/**
 * StoryIllustration renders each scene of the picture book.
 * It uses the unified, cohesive watercolor & ink storybook illustrations
 * with Max looking 100% identical across all pages and screens.
 */
export const StoryIllustration: React.FC<StoryIllustrationProps> = ({
  pageNumber,
  className = '',
  aspectRatio = '4/3',
}) => {
  const aspectClass =
    aspectRatio === '3/4'
      ? 'aspect-[3/4]'
      : aspectRatio === '16/10'
      ? 'aspect-[16/10]'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : 'aspect-[4/3]';

  const item = ILLUSTRATIONS[pageNumber] || ILLUSTRATIONS[1];

  return (
    <div
      className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl bg-amber-50 select-none shadow-sm ${className}`}
    >
      <img
        src={item.src}
        alt={item.alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="eager"
      />
    </div>
  );
};
