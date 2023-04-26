#!/usr/bin/env ts-node

import { $ } from 'execa'
import { LogoSizes } from '../src/constants'

// Make sure img out put directories exist
$`mkdir -p public/icons`
$`mkdir -p public/img`

$`convert src/assets/logo.png -resize 256x256! public/icons/logo.svg`

await Promise.all(
  LogoSizes.map(
    (size) =>
      $`convert src/assets/logo.png -background none -resize ${size}x${size}! -density ${size}x${size} public/img/logo-${size}.png`,
  ),
)

// All the imgs we just created minus the ones too large for ico format
const icoSources = LogoSizes.filter((size) => size <= 256).map(
  (size) => `public/img/logo-${size}.png`,
)

$`convert ${icoSources} public/icons/logo.ico`
