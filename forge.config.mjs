export default {
  packagerConfig: {
    name: 'FitDownloads',
    executableName: 'FitDownloads',
    asar: true,
    icon: './assets/icons/icon'
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'FitDownloads',
        description: 'FitDownloads — Lightning-fast bulk download manager',
        authors: 'Yash Arun Bavale'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ]
};
