// import express from 'express';
// import { promises as fs } from 'fs';
// import { Octokit } from "@octokit/rest";

// const app = express();
// const port = 1313; // Ensure this port is free or change it as necessary

// app.use(express.json()); // No need for bodyParser as express.json() does the same

// const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN
// });

// app.get('/', (req, res) => {
//     res.send('Hello from the server! Use POST /submit to submit data.');
// });

// function writeToLocalFile(firstName, lastName, researchArea, courses) {
//     const content = `${firstName} ${lastName}, Research Area: ${researchArea}, Courses: ${courses}\n`;
//     return fs.appendFile('submissions.txt', content) // Use promise version of fs.appendFile
//         .then(() => console.log('Data appended to file successfully!'))
//         .catch(err => {
//             console.error('Error writing to file:', err);
//             throw err;  // Rethrow to catch it in the endpoint handler
//         });
// }

// async function pushToGitHub(firstName, lastName, researchArea, courses) {
//     const content = `${firstName} ${lastName}, Research Area: ${researchArea}, Courses: ${courses}`;
//     const path = "submissions.txt";
//     const repo = { owner: "selinaz154", repo: "hiddenfigs.github.io" };
    
//     try {
//         const { data: fileData } = await octokit.repos.getContent({
//             ...repo,
//             path,
//             ref: "heads/main"
//         });

//         const { data: updateData } = await octokit.repos.createOrUpdateFileContents({
//             ...repo,
//             path,
//             message: "Update submissions",
//             content: Buffer.from(content).toString('base64'),
//             sha: fileData.sha,
//             branch: "main"
//         });
//         console.log("File updated:", updateData.commit.message);
//         return updateData.commit.message;
//     } catch (error) {
//         console.error("Error updating file:", error);
//         throw error;  // Rethrow to catch it in the endpoint handler
//     }
// }

// app.post('/submit', async (req, res) => {
//     const { firstName, lastName, researchArea, courses } = req.body;
//     try {
//         const content = `${firstName} ${lastName}, Research Area: ${researchArea}, Courses: ${courses}\n`;
//         await fs.appendFile('submissions.txt', content);
//         console.log('Data appended to file successfully!');
//         res.json({ message: "Data successfully written to file." });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'Failed to write data to file.' });
//     }
// });

// app.listen(port, () => {
//     console.log(`Server listening at http://localhost:${port}`);
// });
