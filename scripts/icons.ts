#!/usr/bin/env ts-node

import { $ } from 'execa'
import { LogoSizes } from '../src/constants'

const { exitCode: magickExitCode } = await $({ reject: false })`magick -version`
const { exitCode: convertExitCode } = await $({ reject: false })`convert -version`

if (magickExitCode !== 0 && convertExitCode !== 0) {
  throw new Error('ImageMagick is not installed (missing `magick` or `convert`).')
}

const runConvert = (...args: Array<string | number>) => {
  return magickExitCode === 0 ? $`magick convert ${args}` : $`convert ${args}`
}

// Make sure img out put directories exist
$`mkdir -p public/icons`
$`mkdir -p public/img`

await runConvert('src/assets/logo.png', '-resize', '256x256!', 'public/icons/logo.svg')

await Promise.all(
  LogoSizes.map(
    (size) =>
      runConvert(
        'src/assets/logo.png',
        '-background',
        'none',
        '-resize',
        `${size}x${size}!`,
        '-density',
        `${size}x${size}`,
        `public/img/logo-${size}.png`,
      ),
  ),
)

// All the imgs we just created minus the ones too large for ico format
const icoSources = LogoSizes.filter((size) => size <= 256).map(
  (size) => `public/img/logo-${size}.png`,
)

await runConvert(...icoSources, 'public/icons/logo.ico')
