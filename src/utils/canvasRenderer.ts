import { BabyProfile, VideoConfig } from '../types';
import { ASSET_IMAGES, DEFAULT_SCENES } from '../data/samplePresets';

// Cached Image elements
const imageCache: Record<string, HTMLImageElement> = {};

export function preloadAllImages(): Promise<void> {
  const urls = Object.values(ASSET_IMAGES);
  const promises = urls.map((url) => {
    if (imageCache[url]) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache[url] = img;
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
      img.src = url;
    });
  });
  return Promise.all(promises).then(() => {});
}

// Sparkle particles state
interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedY: number;
  speedX: number;
  color: string;
}

const particles: Particle[] = Array.from({ length: 45 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 2 + Math.random() * 4,
  alpha: 0.3 + Math.random() * 0.7,
  speedY: -0.001 - Math.random() * 0.002,
  speedX: (Math.random() - 0.5) * 0.001,
  color: ['#FFD700', '#FFB6C1', '#FFFFFF', '#E6E6FA'][Math.floor(Math.random() * 4)],
}));

// Steam puff particles for locomotive
interface SteamParticle {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  age: number;
}
const steamPuffs: SteamParticle[] = [
  { x: 0.5, y: 0.18, scale: 0.8, alpha: 0.4, age: 0 },
  { x: 0.52, y: 0.14, scale: 1.2, alpha: 0.3, age: 1 },
  { x: 0.49, y: 0.10, scale: 1.6, alpha: 0.15, age: 2 },
];

export function renderSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  profile: BabyProfile,
  config: VideoConfig,
  customUploadedImage: HTMLImageElement | null = null
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find active scene
  let currentScene = DEFAULT_SCENES[0];
  for (const scene of DEFAULT_SCENES) {
    if (currentTime >= scene.startTime && currentTime < scene.startTime + scene.duration) {
      currentScene = scene;
      break;
    }
  }
  if (currentTime >= DEFAULT_SCENES[DEFAULT_SCENES.length - 1].startTime + DEFAULT_SCENES[DEFAULT_SCENES.length - 1].duration) {
    currentScene = DEFAULT_SCENES[DEFAULT_SCENES.length - 1];
  }

  const sceneProgress = Math.max(0, Math.min(1, (currentTime - currentScene.startTime) / currentScene.duration));

  // Determine background image based on scene and baby gender
  let bgImgUrl = ASSET_IMAGES.locomotiveFront;
  if (currentScene.type === 'baby_spotlight') {
    bgImgUrl = profile.gender === 'boy' ? ASSET_IMAGES.babyBoy : ASSET_IMAGES.babyGarden;
  } else if (currentScene.type === 'date_time_carriage') {
    bgImgUrl = ASSET_IMAGES.trainCarriage;
  } else if (currentScene.type === 'celebrate_carriage') {
    bgImgUrl = ASSET_IMAGES.trainCarriage;
  } else if (currentScene.type === 'baby_boarding') {
    bgImgUrl = ASSET_IMAGES.babySteps;
  } else if (currentScene.type === 'venue_carriage') {
    bgImgUrl = ASSET_IMAGES.trainCarriage;
  } else if (currentScene.type === 'blessing_card') {
    bgImgUrl = ASSET_IMAGES.royalFrame;
  }

  const bgImg = imageCache[bgImgUrl];

  // 3D Parallax camera motion
  ctx.save();

  // Subtle breathing/floating camera zoom and pan
  const zoomFactor = 1.0 + Math.sin(currentTime * 0.8) * 0.02 + sceneProgress * 0.03;
  const panX = Math.sin(currentTime * 0.5) * (width * 0.015);
  const panY = Math.cos(currentTime * 0.4) * (height * 0.008);

  ctx.translate(width / 2 + panX, height / 2 + panY);
  ctx.scale(zoomFactor, zoomFactor);
  ctx.translate(-width / 2, -height / 2);

  // Draw background image
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    // Cover scale
    const hRatio = width / bgImg.naturalWidth;
    const vRatio = height / bgImg.naturalHeight;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (width - bgImg.naturalWidth * ratio) / 2;
    const centerShiftY = (height - bgImg.naturalHeight * ratio) / 2;
    ctx.drawImage(
      bgImg,
      0,
      0,
      bgImg.naturalWidth,
      bgImg.naturalHeight,
      centerShiftX,
      centerShiftY,
      bgImg.naturalWidth * ratio,
      bgImg.naturalHeight * ratio
    );
  } else {
    // Elegant fallback gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#fbcfe8');
    grad.addColorStop(0.5, '#f472b6');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Scene Specific Overlays & Typography
  switch (currentScene.type) {
    case 'intro_locomotive':
      renderScene1Intro(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'baby_spotlight':
      renderScene2BabySpotlight(ctx, width, height, sceneProgress, profile, currentTime, customUploadedImage);
      break;
    case 'date_time_carriage':
      renderScene3DateTime(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'celebrate_carriage':
      renderScene4Celebrate(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'baby_boarding':
      renderScene5BabyBoarding(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'venue_carriage':
      renderScene6Venue(ctx, width, height, sceneProgress, profile, currentTime);
      break;
    case 'blessing_card':
      renderScene7Blessing(ctx, width, height, sceneProgress, profile, currentTime);
      break;
  }

  ctx.restore();


  // Draw floating particles & sparkles overlay
  renderSparkles(ctx, width, height, currentTime, config.sparkleIntensity);

  // Subtle vignette edge for cinematic look
  renderVignette(ctx, width, height);
}



// Scene 1: Locomotive Front with "Kiara is turning ONE!" round medallion
function renderScene1Intro(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  // Medallion position: center-middle of boiler
  const centerX = width * 0.5;
  const centerY = height * 0.44;
  const radius = width * 0.31;

  // Gentle medallion wobble/wreath pulse
  const pulse = 1 + Math.sin(currentTime * 3) * 0.015;
  const entryAlpha = Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = entryAlpha;
  ctx.translate(centerX, centerY);
  ctx.scale(pulse, pulse);

  // Soft luminous backing behind medallion
  const glow = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.3);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glow.addColorStop(0.7, 'rgba(255, 240, 245, 0.88)');
  glow.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Ornate Gold Double Ring Border
  ctx.lineWidth = width * 0.015;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.lineWidth = width * 0.006;
  ctx.strokeStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.94, 0, Math.PI * 2);
  ctx.stroke();

  // Soft Inner shadow / floral rim feel
  ctx.lineWidth = width * 0.012;
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.89, 0, Math.PI * 2);
  ctx.stroke();

  // --- TEXT IN MEDALLION ---
  // Name in elegant script (e.g. Kiara)
  const fontSizeName = Math.round(width * 0.13);
  ctx.font = `italic 700 ${fontSizeName}px "Great Vibes", "Playfair Display", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Pink Gradient for Name
  const nameGrad = ctx.createLinearGradient(0, -radius * 0.45, 0, -radius * 0.05);
  nameGrad.addColorStop(0, '#E11D48');
  nameGrad.addColorStop(1, '#BE185D');

  ctx.shadowColor = 'rgba(244, 114, 182, 0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = nameGrad;
  ctx.fillText(profile.name || 'Our Little Star', 0, -radius * 0.22);

  // "is turning"
  ctx.shadowBlur = 0;
  const fontSizeTurning = Math.round(width * 0.05);
  ctx.font = `600 ${fontSizeTurning}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#831843';
  ctx.letterSpacing = '1px';
  ctx.fillText('is turning', 0, radius * 0.08);

  // "ONE!" in bold festive display
  const fontSizeOne = Math.round(width * 0.16);
  ctx.font = `800 ${fontSizeOne}px "Playfair Display", Georgia, serif`;
  const oneGrad = ctx.createLinearGradient(0, radius * 0.2, 0, radius * 0.65);
  oneGrad.addColorStop(0, '#D946EF');
  oneGrad.addColorStop(0.5, '#EC4899');
  oneGrad.addColorStop(1, '#BE185D');
  ctx.fillStyle = oneGrad;
  ctx.shadowColor = 'rgba(217, 70, 239, 0.5)';
  ctx.shadowBlur = 12;
  ctx.fillText('ONE!', 0, radius * 0.42);

  // Small heart or star below ONE!
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#F59E0B';
  ctx.font = `${Math.round(width * 0.06)}px sans-serif`;
  ctx.fillText('♥', 0, radius * 0.72);

  ctx.restore();

  // Steam puffs from chimney
  renderSteamPuffs(ctx, width, height, currentTime);
}

// Scene 2: Baby Spotlight in Garden (Supports uploaded baby photo in 3D floral cameo frame)
function renderScene2BabySpotlight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number,
  customUploadedImage: HTMLImageElement | null
) {
  // If user uploaded a custom photo, render in a 3D animated floral cameo frame
  if (customUploadedImage && customUploadedImage.complete && customUploadedImage.naturalWidth > 0) {
    const frameX = width * 0.5;
    const frameY = height * 0.42;
    const frameR = width * 0.32;
    const floatOffset = Math.sin(currentTime * 2) * 8;

    ctx.save();
    ctx.translate(frameX, frameY + floatOffset);

    // Glowing halo
    const glow = ctx.createRadialGradient(0, 0, frameR * 0.8, 0, 0, frameR * 1.3);
    glow.addColorStop(0, 'rgba(255, 235, 205, 0.8)');
    glow.addColorStop(1, 'rgba(255, 182, 193, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, frameR * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Clip circular photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, frameR, 0, Math.PI * 2);
    ctx.clip();

    // Draw user photo with center-crop
    const imgRatio = Math.max((frameR * 2) / customUploadedImage.naturalWidth, (frameR * 2) / customUploadedImage.naturalHeight);
    const drawW = customUploadedImage.naturalWidth * imgRatio;
    const drawH = customUploadedImage.naturalHeight * imgRatio;
    ctx.drawImage(customUploadedImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Ornate gold floral frame border
    ctx.lineWidth = width * 0.02;
    ctx.strokeStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(0, 0, frameR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = width * 0.008;
    ctx.strokeStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(0, 0, frameR - width * 0.015, 0, Math.PI * 2);
    ctx.stroke();

    // Cute crown / party hat on top of frame
    ctx.font = `${Math.round(width * 0.12)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👑', 0, -frameR * 0.95);

    ctx.restore();
  }

  // Floating lower badge ribbon: "Meet Our Birthday Star"
  const bannerY = height * 0.78;
  const slideIn = Math.min(1, progress * 2.5);

  ctx.save();
  ctx.globalAlpha = slideIn;
  ctx.translate(width * 0.5, bannerY);

  // Soft frosted ribbon
  const bannerW = width * 0.85;
  const bannerH = height * 0.085;
  const rad = 20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, -bannerW / 2, -bannerH / 2, bannerW, bannerH, rad);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FBCFE8';
  ctx.stroke();

  // Banner text
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9D174D';
  ctx.font = `italic 700 ${Math.round(width * 0.075)}px "Great Vibes", cursive`;
  const bannerTitle = profile.gender === 'boy' ? 'Our Little Prince' : 'Our Little Princess';
  ctx.fillText(profile.name || bannerTitle, 0, -bannerH * 0.12);

  ctx.fillStyle = '#4B5563';
  ctx.font = `600 ${Math.round(width * 0.038)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('1st Birthday Celebration', 0, bannerH * 0.28);

  ctx.restore();
}

// Scene 3: Date & Time carriage panel
function renderScene3DateTime(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  renderCarriagePanel(ctx, width, height, progress, () => {
    // Title: Date & Time in calligraphy
    ctx.textAlign = 'center';
    ctx.font = `italic 700 ${Math.round(width * 0.11)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#9D174D';
    ctx.shadowColor = 'rgba(244, 114, 182, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText('Date & Time', 0, -height * 0.06);

    // Decorative separator line with diamond
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width * 0.25, -height * 0.02);
    ctx.lineTo(width * 0.25, -height * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.fillText('✦', 0, -height * 0.012);

    // Date
    ctx.font = `700 ${Math.round(width * 0.075)}px "Playfair Display", serif`;
    ctx.fillStyle = '#831843';
    ctx.fillText(profile.date || '15 June 2026', 0, height * 0.035);

    // Time (clean, without redundant "Time:" prefix)
    ctx.font = `600 ${Math.round(width * 0.046)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText(profile.time || '6:00 PM onwards', 0, height * 0.08);
  });
}


// Scene 4: "Join us to celebrate the 1st birthday of Kiara"
function renderScene4Celebrate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  renderCarriagePanel(ctx, width, height, progress, () => {
    ctx.textAlign = 'center';

    ctx.font = `600 ${Math.round(width * 0.052)}px "Playfair Display", serif`;
    ctx.fillStyle = '#64748B';
    ctx.fillText('Join us to celebrate', 0, -height * 0.07);

    ctx.font = `600 ${Math.round(width * 0.046)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#9D174D';
    ctx.fillText(`the ${profile.age || 1}${getOrdinal(profile.age || 1)} birthday of`, 0, -height * 0.025);

    // Huge glowing child's name
    ctx.font = `italic 700 ${Math.round(width * 0.16)}px "Great Vibes", cursive`;
    const nameGrad = ctx.createLinearGradient(0, height * 0.01, 0, height * 0.09);
    nameGrad.addColorStop(0, '#E11D48');
    nameGrad.addColorStop(1, '#BE185D');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(244, 114, 182, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(profile.name || 'Our Princess', 0, height * 0.055);
  });
}

// Scene 5: Baby boarding train steps
function renderScene5BabyBoarding(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  // Floating top badge
  const topY = height * 0.12;
  const alpha = Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(width * 0.5, topY);

  const badgeW = width * 0.78;
  const badgeH = height * 0.075;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 12;
  roundRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 18);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#F472B6';
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.font = `italic 700 ${Math.round(width * 0.07)}px "Great Vibes", cursive`;
  ctx.fillStyle = '#BE185D';
  ctx.fillText('All Aboard!', 0, -badgeH * 0.1);

  ctx.font = `600 ${Math.round(width * 0.035)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#4B5563';
  ctx.fillText(`${profile.name || 'Baby'}'s Birthday Train`, 0, badgeH * 0.28);

  ctx.restore();
}

// Scene 6: Venue Carriage
function renderScene6Venue(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  renderCarriagePanel(ctx, width, height, progress, () => {
    ctx.textAlign = 'center';

    // "Venue" title
    ctx.font = `italic 700 ${Math.round(width * 0.12)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#9D174D';
    ctx.shadowColor = 'rgba(244, 114, 182, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText('Venue', 0, -height * 0.06);

    ctx.shadowBlur = 0;
    // Gold separator
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width * 0.25, -height * 0.02);
    ctx.lineTo(width * 0.25, -height * 0.02);
    ctx.stroke();

    // Venue Name
    ctx.font = `700 ${Math.round(width * 0.065)}px "Playfair Display", serif`;
    ctx.fillStyle = '#1E293B';
    ctx.fillText(profile.venueName || 'Little Stars Party Hall', 0, height * 0.035);

    // Venue Address
    ctx.font = `500 ${Math.round(width * 0.042)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#64748B';
    ctx.fillText(profile.venueAddress || 'Satellite Road, Ahmedabad', 0, height * 0.075);
  });
}

// Scene 7: Grand Invitation & Blessing Rococo Card
function renderScene7Blessing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  profile: BabyProfile,
  currentTime: number
) {
  const panelX = width * 0.5;
  const panelY = height * 0.48;
  const panelW = width * 0.82;
  const panelH = height * 0.48;
  const alpha = Math.min(1, progress * 2.5);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(panelX, panelY);

  // Frosted parchment card backing
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 24;
  roundRect(ctx, -panelW / 2, -panelH / 2, panelW, panelH, 24);
  ctx.fill();

  // Double gold & blush border
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#FBCFE8';
  roundRect(ctx, -panelW / 2 + 8, -panelH / 2 + 8, panelW - 16, panelH - 16, 20);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';

  // Opening note
  ctx.font = `italic 500 ${Math.round(width * 0.046)}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = '#831843';
  ctx.fillText('With love,', 0, -panelH * 0.36);

  ctx.font = `400 ${Math.round(width * 0.038)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#475569';
  const line1 = 'we invite you to celebrate our';
  const line2 = profile.gender === 'boy' ? "little prince's special day" : "little princess's special day";
  ctx.fillText(line1, 0, -panelH * 0.24);
  ctx.fillText(line2, 0, -panelH * 0.16);


  // Parents' Names in ornate cursive
  ctx.font = `italic 700 ${Math.round(width * 0.075)}px "Great Vibes", cursive`;
  ctx.fillStyle = '#BE185D';
  ctx.shadowColor = 'rgba(244, 114, 182, 0.4)';
  ctx.shadowBlur = 6;

  // Split parents names if '&' present
  const parents = profile.parentsNames || 'Mr. Rohan Patel & Mrs. Priya Patel';
  if (parents.includes('&')) {
    const parts = parents.split('&');
    ctx.fillText(parts[0].trim(), 0, -panelH * 0.02);
    ctx.font = `600 ${Math.round(width * 0.045)}px "Playfair Display", serif`;
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('&', 0, panelH * 0.08);
    ctx.font = `italic 700 ${Math.round(width * 0.075)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#BE185D';
    ctx.fillText(parts[1].trim(), 0, panelH * 0.19);
  } else {
    ctx.fillText(parents, 0, panelH * 0.06);
  }

  // Small floral flourish / RSVP
  ctx.shadowBlur = 0;
  ctx.font = `600 ${Math.round(width * 0.034)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('♥ Your Presence is Our Greatest Gift ♥', 0, panelH * 0.38);

  ctx.restore();
}

// Reusable Carriage Panel frame (matching the train coach side billboard)
function renderCarriagePanel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  contentCallback: () => void
) {
  const panelX = width * 0.5;
  const panelY = height * 0.38; // matches the carriage side billboard center
  const panelW = width * 0.78;
  const panelH = height * 0.26;

  const alpha = Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(panelX, panelY);

  // Frosted pearl plaque inside the train carriage floral frame
  const bgGrad = ctx.createLinearGradient(0, -panelH / 2, 0, panelH / 2);
  bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  bgGrad.addColorStop(1, 'rgba(254, 242, 242, 0.92)');
  ctx.fillStyle = bgGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, -panelW / 2, -panelH / 2, panelW, panelH, 20);
  ctx.fill();

  // Plaque inner border
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#F9A8D4';
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#D4AF37';
  roundRect(ctx, -panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, panelH - 12, 16);
  ctx.stroke();

  // Run inner text
  contentCallback();

  ctx.restore();
}

// Steam puffs animation
function renderSteamPuffs(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const chimneyX = width * 0.5;
  const chimneyY = height * 0.08;

  ctx.save();
  for (let i = 0; i < steamPuffs.length; i++) {
    const puff = steamPuffs[i];
    const cycle = (time * 1.5 + puff.age) % 3;
    const norm = cycle / 3;
    const curY = chimneyY - norm * (height * 0.07);
    const curX = chimneyX + Math.sin(time * 2 + i) * 12;
    const curScale = (puff.scale + norm * 0.8) * (width * 0.07);
    const curAlpha = Math.max(0, (1 - norm) * puff.alpha);

    const grad = ctx.createRadialGradient(curX, curY, curScale * 0.2, curX, curY, curScale);
    grad.addColorStop(0, `rgba(255, 255, 255, ${curAlpha})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(curX, curY, curScale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Sparkle & floating fairy dust particles
function renderSparkles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const count = Math.round((particles.length * intensity) / 100);

  ctx.save();
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    // Update particle position
    p.y += p.speedY;
    p.x += p.speedX;
    if (p.y < 0) p.y = 1;
    if (p.x < 0) p.x = 1;
    if (p.x > 1) p.x = 0;

    const px = p.x * width;
    const py = p.y * height;
    const twinkle = 0.5 + Math.sin(currentTime * 5 + i * 2) * 0.5;

    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha * twinkle;

    // Draw four-point star sparkle
    drawSparkleStar(ctx, px, py, p.size * (0.8 + twinkle * 0.4));
  }
  ctx.restore();
}

function drawSparkleStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// Cinematic soft vignette
function renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const radius = Math.max(width, height) * 0.75;
  const grad = ctx.createRadialGradient(width / 2, height / 2, radius * 0.55, width / 2, height / 2, radius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');

  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}


