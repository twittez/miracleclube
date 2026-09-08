module.exports = {
  apps: [
    {
      name: 'miracle-backend',
      script: 'server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        META_CAPI_ACCESS_TOKEN: 'EAASGUAkWzKgBSdDnIr0x7bIGxRaQ1bnNSVSzal7yv5TZBUe8lQuGzKW1ZBmfEwBGoDFTFG4OYjepjtYSclO0b21rNaJT1W0L1KT9wAtpYlJlA7XcE2j5uvmcmlpQlVLtZB4qVB35KlYykfZBygbAKMB6KfmPUIdThABzSJ4suePrpv9F7I51ODQ6R7si5gZDZD'
      }
    }
  ]
};
