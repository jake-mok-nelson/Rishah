import { CopilotClient } from "@github/copilot-sdk";
import * as fs from "node:fs";
import * as path from "node:path";

// Parse command-line arguments
const args = process.argv.slice(2);
const inputImagePath = args[0];
const outputDir = args[1];
const outputStyle = args[2] || "all";

if (!inputImagePath || !outputDir) {
  console.error(
    JSON.stringify({
      success: false,
      error:
        "Usage: tsx generate.ts <input-image-path> <output-dir> [style]",
    })
  );
  process.exit(1);
}

if (!fs.existsSync(inputImagePath)) {
  console.error(
    JSON.stringify({
      success: false,
      error: `Input image not found: ${inputImagePath}`,
    })
  );
  process.exit(1);
}

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

async function main() {
  const client = new CopilotClient({ logLevel: "error" });

  try {
    const session = await client.createSession({
      model: "gpt-4.1",
      systemMessage: {
        content: `You are an expert diagram and image transformation assistant.
Your task is to analyze sketches, diagrams, and drawings and produce clean, styled output versions.

When given a diagram or sketch image:
1. Analyze the content and structure of the image
2. Generate styled output based on the requested style
3. Save all generated files to the specified output directory

Available output styles:
- "mermaid": If the image is a flowchart, sequence diagram, or any diagram type, generate equivalent Mermaid diagram code in a .md file
- "description": Generate a detailed text description of the diagram/sketch
- "svg": Generate a clean SVG recreation of the diagram
- "all": Generate all applicable styles

Always save files to the output directory provided.
Be concise and focus on producing accurate output.`,
      },
    });

    // Build the prompt based on the requested style
    let styleInstruction = "";
    switch (outputStyle) {
      case "mermaid":
        styleInstruction =
          "Generate a Mermaid diagram (.md file) that represents this image. Only generate mermaid if it's a diagram/flowchart type image.";
        break;
      case "description":
        styleInstruction =
          "Generate a detailed text description of this image and save it as a .txt file.";
        break;
      case "svg":
        styleInstruction =
          "Generate a clean SVG recreation of this diagram and save it as a .svg file.";
        break;
      case "all":
      default:
        styleInstruction = `Generate multiple output styles for this image:
1. A detailed text description saved as "description.txt"
2. If the image contains a diagram, flowchart, sequence diagram, or any structured diagram, generate Mermaid code saved as "diagram.md" with proper mermaid code blocks
3. A clean SVG recreation saved as "recreation.svg"

Save all files to: ${outputDir}`;
        break;
    }

    // Set up event handling
    session.on((event) => {
      if (event.type === "tool.execution_start") {
        console.error(`  → Running: ${event.data.toolName}`);
      }
    });

    await session.sendAndWait({
      prompt: `I have a sketch/diagram image at "${inputImagePath}".

Please analyze this image and ${styleInstruction}

The output directory is: ${outputDir}

After generating the files, list all the files you created with their full paths.`,
    });

    await session.destroy();
    await client.stop();

    // Scan output directory for any generated files
    const outputFiles: string[] = [];
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        if (fs.statSync(filePath).isFile()) {
          outputFiles.push(filePath);
        }
      }
    }

    // Output result as JSON for the Go backend to parse
    console.log(
      JSON.stringify({
        success: true,
        files: outputFiles,
        outputDir: outputDir,
      })
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        success: false,
        error: `Failed to generate image: ${errorMessage}`,
      })
    );
    await client.stop();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      success: false,
      error: `Unexpected error: ${err.message || err}`,
    })
  );
  process.exit(1);
});
