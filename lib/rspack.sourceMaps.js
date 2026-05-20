export function loaderSourceMaps(options) {
  const sourceMaps = options.build.sourceMaps
  return !!sourceMaps && !String(sourceMaps).includes('eval')
}
