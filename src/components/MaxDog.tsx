import React from 'react';

export type DogPose =
  | 'proud_stand'    // Cover & Page 1: Standing proud and brave
  | 'hiding_pot'      // Page 2: Crouching low, peeking out nervously
  | 'eating_snack'    // Page 3: Sitting with paw on peanut butter jar
  | 'messy_play'      // Page 4: Sitting silly in toilet paper tangle
  | 'puddle_splash'   // Page 5: Splashing paws down into mud puddle
  | 'leaping_catch'   // Page 6: Leaping mid-air to catch the red ball
  | 'bath_splash'     // Page 7: Splashing inside bathtub with suds
  | 'wet_shiver'      // Page 8: Dripping soaking wet on bath mat
  | 'sleeping_cozy'   // Page 9: Curled up asleep in bed with cat
  | 'sleeping_closeup'// Page 10: Close-up sleeping nose-to-nose with cat
  | 'celebrating';    // Result & Final: Jumping/standing with medal

export type DogExpression =
  | 'proud'
  | 'nervous'
  | 'eating'
  | 'silly'
  | 'splashing'
  | 'leaping'
  | 'sleepy'
  | 'celebrating';

export interface MaxDogProps {
  pose?: DogPose;
  expression?: DogExpression;
  size?: number | string;
  className?: string;
  peanutButterOnNose?: boolean;
  muddyPaws?: boolean;
  soapBubbles?: boolean;
  isWet?: boolean;
  hasMedal?: boolean;
}

/**
 * MaxDog: Single reusable SVG drawing for Max the dog.
 * Used on every illustration across the app (Cover, all 10 pages, question screens, Result screen).
 * Keeps identical body shape, head shape, ear shape, fur colors, spots, eyes, nose, tail, and art style.
 * Only pose, size, position, expression, and story accessories change via props.
 */
export const MaxDog: React.FC<MaxDogProps> = ({
  pose = 'proud_stand',
  expression,
  size = '100%',
  className = '',
  peanutButterOnNose = false,
  muddyPaws = false,
  soapBubbles = false,
  isWet = false,
  hasMedal = false,
}) => {
  // Derive default expression from pose if not explicitly specified
  const effectiveExpression: DogExpression =
    expression ||
    (pose === 'hiding_pot' || pose === 'wet_shiver'
      ? 'nervous'
      : pose === 'eating_snack'
      ? 'eating'
      : pose === 'messy_play'
      ? 'silly'
      : pose === 'puddle_splash' || pose === 'bath_splash'
      ? 'splashing'
      : pose === 'leaping_catch'
      ? 'leaping'
      : pose === 'sleeping_cozy' || pose === 'sleeping_closeup'
      ? 'sleepy'
      : pose === 'celebrating'
      ? 'celebrating'
      : 'proud');

  // Shared Color Palette (Identical across all illustrations)
  const FUR_BASE = '#F59E0B';     // Warm Golden Honey
  const FUR_HIGHLIGHT = '#FBBF24';// Golden Yellow Highlight
  const FUR_SHADOW = '#D97706';   // Amber Fur Shadow
  const FUR_CREAM = '#FEF3C7';    // Muzzle & Chest Cream
  const EAR_OUTER = '#D97706';    // Golden Brown Ear
  const EAR_INNER = '#FDE68A';    // Soft Inner Ear
  const EYE_COLOR = '#1E293B';    // Deep Dark Button Eye
  const NOSE_COLOR = '#0F172A';   // Button Black Nose
  const TONGUE_COLOR = '#FB7185'; // Soft Pink Tongue
  const COLLAR_RED = '#EF4444';   // Bright Red Collar
  const COLLAR_TAG = '#F59E0B';   // Gold Tag
  const MUD_BROWN = '#78350F';    // Rich Mud Splatter
  const BUBBLE_COLOR = '#BAE6FD'; // Soft Cyan Soap Suds

  // Specific transformations per pose
  const isLeaping = pose === 'leaping_catch';
  const isSleeping = pose === 'sleeping_cozy' || pose === 'sleeping_closeup';
  const isHiding = pose === 'hiding_pot';
  const isBath = pose === 'bath_splash';
  const isWetPose = pose === 'wet_shiver' || isWet;
  const isCelebrating = pose === 'celebrating';

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Shared Gradients */}
        <radialGradient id="maxFurGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={FUR_HIGHLIGHT} />
          <stop offset="65%" stopColor={FUR_BASE} />
          <stop offset="100%" stopColor={FUR_SHADOW} />
        </radialGradient>
        <linearGradient id="maxEarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={EAR_OUTER} />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="maxChestCream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor={FUR_CREAM} />
        </linearGradient>
        <linearGradient id="bubbleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor={BUBBLE_COLOR} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.4" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* --- TAIL --- */}
      {!isSleeping && (
        <g
          className="tail-group"
          transform={
            isLeaping
              ? 'translate(25, 120) rotate(-20)'
              : isHiding
              ? 'translate(55, 140) rotate(-40)'
              : 'translate(45, 105) rotate(10)'
          }
        >
          <path
            d="M 15 15 C 5 5, -15 2, -22 -12 C -24 -16, -18 -20, -14 -16 C -6 -7, 6 -3, 20 6 Z"
            fill="url(#maxFurGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Fur tuft on tail tip */}
          <path
            d="M -18 -14 Q -16 -20 -10 -15"
            stroke={FUR_HIGHLIGHT}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* --- BODY & HIND LEGS --- */}
      {isSleeping ? (
        /* Curled up sleeping body */
        <g transform="translate(100, 130)">
          <ellipse
            cx="0"
            cy="0"
            rx="55"
            ry="40"
            fill="url(#maxFurGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="3"
          />
          {/* Tucked tail over paws */}
          <path
            d="M -45 5 C -35 25, 10 35, 40 20"
            fill="none"
            stroke={FUR_SHADOW}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M -45 5 C -35 25, 10 35, 40 20"
            fill="none"
            stroke={FUR_HIGHLIGHT}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Paws curled in */}
          <ellipse cx="25" cy="18" rx="10" ry="7" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="2" />
        </g>
      ) : isBath ? (
        /* Inside bathtub: Upper torso visible in bubbly water */
        <g transform="translate(100, 140)">
          <ellipse
            cx="0"
            cy="0"
            rx="45"
            ry="30"
            fill="url(#maxFurGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="3"
          />
          {/* Cream chest patch */}
          <ellipse cx="0" cy="-5" rx="22" ry="18" fill="url(#maxChestCream)" />
        </g>
      ) : isLeaping ? (
        /* Leaping body extended mid-air */
        <g transform="translate(95, 115) rotate(-15)">
          {/* Back legs reaching back */}
          <path
            d="M -25 20 C -45 35, -55 45, -45 50 C -40 52, -30 42, -15 28"
            fill="url(#maxFurGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="2.5"
          />
          {/* Main torso */}
          <ellipse cx="0" cy="5" rx="42" ry="28" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="3" />
          {/* Cream belly */}
          <path d="M -15 15 Q 0 28 20 15 Q 0 5 -15 15 Z" fill="url(#maxChestCream)" />
          {/* Front legs reaching forward */}
          <path
            d="M 25 10 C 45 22, 60 25, 62 18 C 64 12, 45 5, 25 -2"
            fill="url(#maxFurGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="2.5"
          />
          {/* Paws */}
          <ellipse cx="60" cy="19" rx="8" ry="6" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="1.5" />
          {muddyPaws && (
            <ellipse cx="61" cy="20" rx="6" ry="5" fill={MUD_BROWN} opacity="0.9" />
          )}
        </g>
      ) : (
        /* Standard standing / sitting puppy torso */
        <g transform="translate(100, 130)">
          {/* Back paws / haunches */}
          <ellipse cx="-32" cy="28" rx="15" ry="10" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2.5" />
          <ellipse cx="32" cy="28" rx="15" ry="10" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2.5" />
          {/* Main plump body */}
          <ellipse
            cx="0"
            cy="5"
            rx="38"
            ry="34"
            fill="url(#maxFurGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="3"
          />
          {/* Fluffy Cream Chest Patch */}
          <path
            d="M 0 -18 C 15 -18, 22 2, 14 18 C 8 28, -8 28, -14 18 C -22 2, -15 -18, 0 -18 Z"
            fill="url(#maxChestCream)"
          />
          {/* Front Legs */}
          {pose === 'puddle_splash' ? (
            /* Front paws stomping wide down into splash */
            <g>
              <path d="M -22 8 L -30 35 L -14 36 L -10 10 Z" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2" />
              <path d="M 10 10 L 14 36 L 30 35 L 22 8 Z" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2" />
              <ellipse cx="-22" cy="36" rx="10" ry="7" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="2" />
              <ellipse cx="22" cy="36" rx="10" ry="7" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="2" />
            </g>
          ) : pose === 'eating_snack' ? (
            /* Left paw down, right paw raised cute */
            <g>
              <rect x="-24" y="6" width="14" height="28" rx="7" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2" />
              <ellipse cx="-17" cy="33" rx="9" ry="6" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="1.8" />
              {/* Raised right paw */}
              <rect x="8" y="-2" width="14" height="26" rx="7" transform="rotate(30, 15, 10)" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2" />
              <ellipse cx="28" cy="18" rx="8" ry="6" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="1.8" />
            </g>
          ) : (
            /* Standard two front paws planted */
            <g>
              <rect x="-20" y="8" width="13" height="28" rx="6.5" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2" />
              <rect x="7" y="8" width="13" height="28" rx="6.5" fill="url(#maxFurGrad)" stroke={FUR_SHADOW} strokeWidth="2" />
              <ellipse cx="-14" cy="35" rx="8" ry="6" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="2" />
              <ellipse cx="14" cy="35" rx="8" ry="6" fill={FUR_CREAM} stroke={FUR_SHADOW} strokeWidth="2" />
              {/* Toe lines */}
              <line x1="-16" y1="34" x2="-16" y2="38" stroke={FUR_SHADOW} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="-12" y1="34" x2="-12" y2="38" stroke={FUR_SHADOW} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="12" y1="34" x2="12" y2="38" stroke={FUR_SHADOW} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="16" y1="34" x2="16" y2="38" stroke={FUR_SHADOW} strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}

          {/* Muddy paws overlay if active */}
          {(muddyPaws || pose === 'puddle_splash' || pose === 'messy_play') && (
            <g fill={MUD_BROWN} opacity="0.95">
              <ellipse cx="-14" cy="36" rx="9" ry="5" />
              <ellipse cx="14" cy="36" rx="9" ry="5" />
              <circle cx="-18" cy="32" r="2" />
              <circle cx="18" cy="33" r="2.5" />
              <circle cx="-10" cy="28" r="1.8" />
              <circle cx="10" cy="27" r="2" />
            </g>
          )}
        </g>
      )}

      {/* --- COLLAR & TAG --- */}
      {!isSleeping && (
        <g transform="translate(100, 108)">
          {/* Red collar band curved under neck */}
          <path
            d="M -26 -2 Q 0 10 26 -2 Q 0 4 -26 -2 Z"
            fill={COLLAR_RED}
            stroke="#B91C1C"
            strokeWidth="1.8"
          />
          {/* Golden round collar tag */}
          <circle cx="0" cy="8" r="5" fill={COLLAR_TAG} stroke="#B45309" strokeWidth="1.5" />
          <circle cx="-1" cy="7" r="1.5" fill="#FEF3C7" />

          {/* Special Award Medal if celebrating */}
          {(hasMedal || isCelebrating) && (
            <g transform="translate(0, 10)">
              {/* Blue ribbons */}
              <path d="M -5 3 L -9 18 L -3 15 L 0 5 Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
              <path d="M 5 3 L 9 18 L 3 15 L 0 5 Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
              {/* Shiny Gold Star Medal */}
              <circle cx="0" cy="12" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
              <path
                d="M 0 6 L 2 10 L 6 10 L 3 13 L 4 17 L 0 14 L -4 17 L -3 13 L -6 10 L -2 10 Z"
                fill="#FEF08A"
              />
            </g>
          )}
        </g>
      )}

      {/* --- HEAD GROUP --- */}
      <g
        className="head-group"
        transform={
          isSleeping
            ? 'translate(80, 115) rotate(-15)'
            : isHiding
            ? 'translate(100, 95) scale(0.95)'
            : isLeaping
            ? 'translate(130, 85) rotate(-10)'
            : 'translate(100, 75)'
        }
      >
        {/* Left Ear (Droopy Fluffy Golden-Brown) */}
        <g
          transform={
            effectiveExpression === 'nervous'
              ? 'translate(-38, -22) rotate(22)'
              : effectiveExpression === 'splashing' || isLeaping
              ? 'translate(-42, -18) rotate(-15)'
              : 'translate(-38, -12) rotate(8)'
          }
        >
          <path
            d="M 5 0 C -12 8, -24 30, -18 52 C -14 62, -2 64, 8 52 C 16 42, 18 20, 10 0 Z"
            fill="url(#maxEarGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner Ear shading */}
          <path
            d="M 0 12 C -8 20, -14 36, -10 46 C -6 52, 2 50, 6 40 C 10 32, 10 20, 4 12 Z"
            fill={EAR_INNER}
            opacity="0.8"
          />
        </g>

        {/* Right Ear */}
        <g
          transform={
            effectiveExpression === 'nervous'
              ? 'translate(38, -22) rotate(-22)'
              : effectiveExpression === 'splashing' || isLeaping
              ? 'translate(42, -18) rotate(15)'
              : 'translate(38, -12) rotate(-8)'
          }
        >
          <path
            d="M -5 0 C 12 8, 24 30, 18 52 C 14 62, 2 64, -8 52 C -16 42, -18 20, -10 0 Z"
            fill="url(#maxEarGrad)"
            stroke={FUR_SHADOW}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner Ear shading */}
          <path
            d="M 0 12 C 8 20, 14 36, 10 46 C 6 52, -2 50, -6 40 C -10 32, -10 20, -4 12 Z"
            fill={EAR_INNER}
            opacity="0.8"
          />
        </g>

        {/* Head Base (Round, Fluffy Cheek Tufts) */}
        <path
          d="M 0 -36
             C 24 -36, 42 -22, 45 -2
             C 48 10, 44 26, 36 34
             C 28 42, 16 45, 0 45
             C -16 45, -28 42, -36 34
             C -44 26, -48 10, -45 -2
             C -42 -22, -24 -36, 0 -36 Z"
          fill="url(#maxFurGrad)"
          stroke={FUR_SHADOW}
          strokeWidth="3"
        />

        {/* Cheek Fluff Tufts on sides */}
        <path
          d="M -44 4 Q -54 12 -44 20 Q -52 24 -38 28"
          fill="url(#maxFurGrad)"
          stroke={FUR_SHADOW}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M 44 4 Q 54 12 44 20 Q 52 24 38 28"
          fill="url(#maxFurGrad)"
          stroke={FUR_SHADOW}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Forehead cute fur tuft */}
        <path
          d="M -6 -35 Q 0 -44 6 -35 Q 12 -42 10 -32"
          fill="url(#maxFurGrad)"
          stroke={FUR_SHADOW}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Cream Muzzle Patch */}
        <path
          d="M 0 2
             C 16 2, 28 14, 26 28
             C 24 38, 14 42, 0 42
             C -14 42, -24 38, -26 28
             C -28 14, -16 2, 0 2 Z"
          fill="url(#maxChestCream)"
        />

        {/* Rosy Cheek Blush */}
        <ellipse cx="-26" cy="18" rx="8" ry="5" fill="#FDA4AF" opacity="0.6" />
        <ellipse cx="26" cy="18" rx="8" ry="5" fill="#FDA4AF" opacity="0.6" />

        {/* --- EYES & EYEBROWS --- */}
        {effectiveExpression === 'sleepy' ? (
          /* Sleeping peaceful crescent curves */
          <g>
            <path d="M -24 6 Q -16 14 -8 6" stroke={EYE_COLOR} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 8 6 Q 16 14 24 6" stroke={EYE_COLOR} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Gentle lashes */}
            <path d="M -16 11 L -16 14" stroke={EYE_COLOR} strokeWidth="2" strokeLinecap="round" />
            <path d="M 16 11 L 16 14" stroke={EYE_COLOR} strokeWidth="2" strokeLinecap="round" />
            {/* Peaceful eyebrows */}
            <path d="M -24 -2 Q -16 -6 -8 -2" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 8 -2 Q 16 -6 24 -2" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        ) : effectiveExpression === 'eating' ? (
          /* Happy closed smiling eye crescents ^ ^ */
          <g>
            <path d="M -24 8 Q -16 -2 -8 8" stroke={EYE_COLOR} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 8 8 Q 16 -2 24 8" stroke={EYE_COLOR} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Happy raised eyebrows */}
            <path d="M -24 -4 Q -16 -12 -8 -4" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 8 -4 Q 16 -12 24 -4" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          /* Expressive Big Cartoon Button Eyes */
          <g>
            {/* Left Eye */}
            <ellipse
              cx="-17"
              cy={effectiveExpression === 'nervous' ? '5' : '6'}
              rx={effectiveExpression === 'nervous' ? '9' : '8.5'}
              ry={effectiveExpression === 'nervous' ? '10' : '9.5'}
              fill={EYE_COLOR}
            />
            {/* Primary Catchlight */}
            <circle cx="-14" cy="3" r="3.5" fill="#FFFFFF" />
            {/* Secondary Catchlight */}
            <circle cx="-19" cy="8" r="1.8" fill="#FFFFFF" />

            {/* Right Eye */}
            <ellipse
              cx="17"
              cy={effectiveExpression === 'nervous' ? '5' : '6'}
              rx={effectiveExpression === 'nervous' ? '9' : '8.5'}
              ry={effectiveExpression === 'nervous' ? '10' : '9.5'}
              fill={EYE_COLOR}
            />
            {/* Primary Catchlight */}
            <circle cx="20" cy="3" r="3.5" fill="#FFFFFF" />
            {/* Secondary Catchlight */}
            <circle cx="15" cy="8" r="1.8" fill="#FFFFFF" />

            {/* Eyebrows matching expression */}
            {effectiveExpression === 'nervous' ? (
              /* Worried puppy dog eyebrows tilted up in center */
              <g stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" fill="none">
                <path d="M -26 -2 Q -18 -10 -10 -5" />
                <path d="M 10 -5 Q 18 -10 26 -2" />
              </g>
            ) : effectiveExpression === 'celebrating' ? (
              /* Joyful arched brows with sparkle */
              <g stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" fill="none">
                <path d="M -26 -6 Q -17 -14 -8 -6" />
                <path d="M 8 -6 Q 17 -14 26 -6" />
              </g>
            ) : (
              /* Confident / brave friendly brows */
              <g stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M -25 -4 Q -16 -9 -8 -5" />
                <path d="M 8 -5 Q 16 -9 25 -4" />
              </g>
            )}
          </g>
        )}

        {/* --- NOSE --- */}
        <g transform="translate(0, 16)">
          <path
            d="M -7 -4 C -7 -6, 7 -6, 7 -4 C 8 2, 3 6, 0 7 C -3 6, -8 2, -7 -4 Z"
            fill={NOSE_COLOR}
          />
          {/* Nose shine highlight */}
          <ellipse cx="-2" cy="-3" rx="2.5" ry="1.2" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* --- MOUTH & TONGUE --- */}
        {effectiveExpression === 'nervous' ? (
          /* Wavy worried mouth */
          <path
            d="M -10 27 Q -5 24 0 27 Q 5 30 10 27"
            stroke="#78350F"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        ) : effectiveExpression === 'splashing' || effectiveExpression === 'celebrating' || effectiveExpression === 'silly' ? (
          /* Open happy panting mouth with cute tongue */
          <g>
            <path
              d="M -9 24 Q 0 34 9 24"
              stroke="#78350F"
              strokeWidth="2.2"
              fill="#991B1B"
            />
            {/* Pink tongue sticking out */}
            <path
              d="M -5 27 C -5 36, 5 36, 5 27 Z"
              fill={TONGUE_COLOR}
              stroke="#E11D48"
              strokeWidth="1.2"
            />
            <line x1="0" y1="28" x2="0" y2="33" stroke="#E11D48" strokeWidth="1" />
          </g>
        ) : (
          /* Classic cute curved puppy mouth */
          <path
            d="M -9 24 Q -4 28 0 24 Q 4 28 9 24"
            stroke="#78350F"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Peanut Butter Dollop on Nose (Page 3 Clue) */}
        {(peanutButterOnNose || pose === 'eating_snack') && (
          <g transform="translate(2, 13)">
            <ellipse cx="0" cy="0" rx="6" ry="4.5" fill="#92400E" stroke="#78350F" strokeWidth="1" />
            <circle cx="4" cy="2" r="2" fill="#92400E" />
            <ellipse cx="-1.5" cy="-1.5" rx="2" ry="1" fill="#B45309" />
          </g>
        )}

        {/* Soap Bubbles on Head / Ears (Page 7 & 8 Clues) */}
        {(soapBubbles || isBath || pose === 'wet_shiver') && (
          <g className="soap-bubbles">
            <circle cx="-16" cy="-36" r="7" fill="url(#bubbleGrad)" stroke="#E0F2FE" strokeWidth="0.8" />
            <circle cx="-18" cy="-38" r="2" fill="#FFFFFF" />
            <circle cx="8" cy="-38" r="8" fill="url(#bubbleGrad)" stroke="#E0F2FE" strokeWidth="0.8" />
            <circle cx="6" cy="-41" r="2.5" fill="#FFFFFF" />
            <circle cx="-2" cy="-44" r="5.5" fill="url(#bubbleGrad)" stroke="#E0F2FE" strokeWidth="0.8" />
            <circle cx="34" cy="-14" r="6" fill="url(#bubbleGrad)" stroke="#E0F2FE" strokeWidth="0.8" />
            <circle cx="-32" cy="-12" r="5" fill="url(#bubbleGrad)" stroke="#E0F2FE" strokeWidth="0.8" />
          </g>
        )}

        {/* Soaking Wet Spiky Dripping Fur (Page 8 Clue) */}
        {isWetPose && (
          <g className="wet-drops" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round">
            {/* Dripping water streaks from chin and ears */}
            <path d="M -32 46 L -32 54" />
            <path d="M 32 46 L 32 54" />
            <path d="M 0 46 L 0 55" />
            <circle cx="-32" cy="58" r="2" fill="#38BDF8" stroke="none" />
            <circle cx="32" cy="58" r="2" fill="#38BDF8" stroke="none" />
            <circle cx="0" cy="60" r="2.5" fill="#38BDF8" stroke="none" />
          </g>
        )}
      </g>

      {/* Floating Zzz when sleeping */}
      {isSleeping && (
        <g fill="#6366F1" fontFamily="sans-serif" fontWeight="bold">
          <text x="140" y="70" fontSize="18" opacity="0.8">Z</text>
          <text x="155" y="55" fontSize="14" opacity="0.6">z</text>
          <text x="168" y="42" fontSize="11" opacity="0.4">z</text>
        </g>
      )}

      {/* Celebration Sparkles */}
      {(isCelebrating || hasMedal) && (
        <g fill="#F59E0B">
          <path d="M 25 35 Q 30 35 30 30 Q 30 35 35 35 Q 30 35 30 40 Q 30 35 25 35 Z" />
          <path d="M 165 45 Q 170 45 170 40 Q 170 45 175 45 Q 170 45 170 50 Q 170 45 165 45 Z" fill="#EC4899" />
          <path d="M 155 130 Q 160 130 160 125 Q 160 130 165 130 Q 160 130 160 135 Q 160 130 155 130 Z" fill="#3B82F6" />
        </g>
      )}
    </svg>
  );
};
