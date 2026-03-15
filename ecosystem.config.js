module.exports = {
  apps : [{
    name: "looloo-api",
    script: "./bin/www",
		// watch: "../looloo-api/",
		watch: ["server", "client"],
		watch_options: {
		    followSymlinks: false,
		    usePolling: true
		},
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
