import os from 'os';
import path from 'path';
import fs from 'fs';
import sudo from '@vscode/sudo-prompt';


// Inside your setCertTS.ts
export const trustMitmproxyCert = () => {
  const certPath = path.join(os.homedir(), '.mitmproxy', 'mitmproxy-ca-cert.pem');

  if (fs.existsSync(certPath)) {
    const options = {
      name: 'Spotify Lyrics Extractor',
    };

    // Adding 'sudo' here inside the string often forces the OS to 
    // allow the graphical trust prompt to appear.
    const command = `security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${certPath}"`;

    sudo.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to install cert: ${error}`);
        return;
      }
      console.log('Successfully added certificate.');
    });
  }
};





// // // Inside your setCertTS.ts
// // export const trustMitmproxyCert = () => {
// //   const certPath = path.join(os.homedir(), '.mitmproxy', 'mitmproxy-ca-cert.pem');

// //   if (fs.existsSync(certPath)) {
// //     const options = {
// //       name: 'Spotify Lyrics Extractor',
// //     };

// //     // Adding 'sudo' here inside the string often forces the OS to 
// //     // allow the graphical trust prompt to appear.
// //     const command = `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${certPath}"`;

// //     sudo.exec(command, options, (error, stdout, stderr) => {
// //       if (error) {
// //         console.error(`Failed to install cert: ${error}`);
// //         return;
// //       }
// //       console.log('Successfully added certificate.');
// //     });
// //   }
// // };
// // // export function trustMitmproxyCert() {
// // //   // 1. Resolve the path to the cert (~/.mitmproxy/...)
// // //   const certPath = path.join(os.homedir(), '.mitmproxy', 'mitmproxy-ca-cert.pem');

// // //   // 2. Check if the file exists
// // //   if (fs.existsSync(certPath)) {
// // //     const options = {
// // //       name: 'Spotify Lyrics Extractor',
// // //     };

// // //     // 3. Construct the 'security' command
// // //     // We don't include "sudo" here because sudo.exec handles it.
// // //     const command = `security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${certPath}"`;

// // //     console.log('Requesting admin privileges to install certificate...');

// // //     // 4. Execute with elevated privileges
// // //     sudo.exec(command, options, (error, stdout, stderr) => {
// // //       if (error) {
// // //         console.error(`Failed to install cert: ${error.message}`);
// // //         return;
// // //       }
// // //       if (stderr) {
// // //         console.warn(`Security Warning: ${stderr}`);
// // //       }
// // //       console.log('Successfully added certificate to Keychain.');
// // //       console.log(stdout);
// // //     });
// // //   } else {
// // //     console.error(`Cert not found at ${certPath}. Run mitmproxy once first to generate it.`);
// // //   }
// // // }

// // // export trustMitmproxyCert;


// import os from 'os';
// import fs from 'fs';
// import path from 'path';
// import { exec } from 'child_process'; // Try standard exec first
// import sudo from '@vscode/sudo-prompt';

// export const trustMitmproxyCert = () => {
//   const certPath = path.join(os.homedir(), '.mitmproxy', 'mitmproxy-ca-cert.pem');

//   if (fs.existsSync(certPath)) {
//     // Target the user's login keychain database
//     const keychainPath = path.join(os.homedir(), 'Library/Keychains/login.keychain-db');
    

//     // Use -p ssl to target the SSL/TLS trust policy directly
//     // const command = `security add-trusted-cert -d -r trustRoot -p ssl -k "${keychainPath}" "${certPath}"`;
//     // // Command to add and trust the cert in the Login keychain
//     const command = `security add-trusted-cert -d -r trustRoot -k "${keychainPath}" "${certPath}"`;

//     console.log('Installing certificate to Login Keychain...');

//     // Try standard exec first; if it fails, fallback to sudo.exec
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Standard install failed, trying with sudo: ${error.message}`);
        
//         // Fallback to sudo if permissions are still tight
//         // const sudo = require('@vscode/sudo-prompt');
//         sudo.exec(command, { name: 'Spotify Lyrics Extractor' }, (sudoErr, sOut, sErr) => {
//           if (sudoErr) {
//             console.error('Sudo installation also failed:', sudoErr);
//           } else {
//             console.log('Successfully added to Login Keychain via sudo.');
//           }
//         });
//         return;
//       }
//       console.log('Successfully added certificate to Login Keychain.');
//     });
//   } else {
//     console.error(`Cert not found at ${certPath}`);
//   }
// };