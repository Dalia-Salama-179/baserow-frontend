export default function (
  base = '@',
  premiumBase = '@/premium/web-frontend'
) {
  // Support adding in extra modules say from a plugin using the ADDITIONAL_MODULES
  // env variable which is a comma separated list of absolute module paths.
  const additionalModulesCsv = process.env.ADDITIONAL_MODULES
  const additionalModules = additionalModulesCsv
    ? additionalModulesCsv.split(',')
    : []

  const baseModules = [
    base + '/modules/core/module.js',
    base + '/modules/database/module.js',
    premiumBase + '/modules/baserow_premium/module.js',
  ]

  const modules = baseModules.concat(additionalModules)
  return {
    modules,
    build: {
      extend(config, ctx) {
        config.node = { fs: 'empty' }
      },
      babel: { compact: true },
    },
  }
}
