#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const backendPath = path.join(__dirname, '..', 'backend')

// Check if storage link already points to expected location
const publicStorage = path.join(backendPath, 'public', 'storage')
const target = path.join(backendPath, 'storage', 'app', 'public')

function runArtisanLink() {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'php' : 'php'
    const args = ['artisan', 'storage:link']
    const proc = spawn(cmd, args, { cwd: backendPath, stdio: 'inherit' })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('artisan storage:link failed with code ' + code))
    })
    proc.on('error', (err) => reject(err))
  })
}

async function ensure() {
  try {
    // if public/storage exists and looks like a directory but not the target, remove it
    if (fs.existsSync(publicStorage)) {
      const stat = fs.lstatSync(publicStorage)
      // If it's a symlink, leave it and try artisan which will re-link if needed
      if (stat.isSymbolicLink()) {
        console.log('public/storage is a symbolic link — attempting to ensure via artisan')
        await runArtisanLink()
        console.log('storage:link finished')
        return
      }

      // If it's a directory, but target contains files, prefer to create the symlink: remove dir first
      if (stat.isDirectory()) {
        console.log('public/storage is a directory — removing and recreating the link')
        fs.rmSync(publicStorage, { recursive: true, force: true })
      }
    }

    await runArtisanLink()
    console.log('Storage link created/ensured successfully')
  } catch (err) {
    console.error('Failed to ensure storage link:', err.message || err)
    process.exit(1)
  }
}

ensure()
