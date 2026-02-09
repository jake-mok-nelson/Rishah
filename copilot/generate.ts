import { CopilotClient } from "@github/copilot-sdk";
import * as fs from "node:fs";
import * as path from "node:path";

// Parse command-line arguments
const args = process.argv.slice(2);
const inputImagePath = args[0];
const outputDir = args[1];
const outputStyle = args[2] || "clean";

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
Your task is to analyze sketches, diagrams, and drawings and produce styled SVG output versions.

IMPORTANT: You MUST output the result as a valid SVG file. The SVG should be a complete, self-contained SVG document.

When given a diagram or sketch image, analyze it and recreate it as an SVG in the requested visual style.

Available visual styles:
- "sketch": Recreate the image as a hand-drawn sketch style SVG with rough edges, imperfect lines, and a casual feel. Use slightly wobbly paths instead of straight lines.
- "clean": Recreate the image as a clean, professional SVG with crisp lines, proper alignment, and a polished look. Use geometric precision.
- "detailed": Recreate the image as a highly detailed SVG with labels, annotations, shadows, and gradients for a presentation-ready look.
- "mermaid": If the image is a diagram (flowchart, sequence diagram, etc.), generate Mermaid diagram code. Output the mermaid code as plain text (not SVG). If it's not a diagram, generate a clean SVG instead.

Always save the output file to the specified output directory.
For SVG styles, save as "generated.svg".
For mermaid style, save as "generated.mmd".`,
      },
    });

    // Build the prompt based on the requested style
    let styleInstruction = "";
    let outputFileName = "generated.svg";
    switch (outputStyle) {
      case "sketch":
        styleInstruction =
          'Recreate this image as a hand-drawn sketch style SVG. Use wobbly lines, rough edges, and an informal hand-drawn feel. Save the SVG file.';
        break;
      case "detailed":
        styleInstruction =
          'Recreate this image as a highly detailed, presentation-ready SVG with labels, annotations, shadows, and gradients. Save the SVG file.';
        break;
      case "mermaid":
        styleInstruction =
          'If this image contains a diagram (flowchart, sequence diagram, state diagram, etc.), generate equivalent Mermaid diagram code. Save the output as plain text Mermaid code. If it is not a diagram, generate a clean SVG recreation instead.';
        outputFileName = "generated.mmd";
        break;
      case "clean":
      default:
        styleInstruction =
          'Recreate this image as a clean, professional SVG with crisp geometric lines, proper alignment, and a polished look. Save the SVG file.';
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

Save the output file as "${path.join(outputDir, outputFileName)}".`,
    });

    await session.destroy();
    await client.stop();

    // Read the generated output file content
    const outputFilePath = path.join(outputDir, outputFileName);
    // Also check for SVG if mermaid was requested but a diagram wasn't found
    const svgFallback = path.join(outputDir, "generated.svg");

    let content = "";
    let actualFileName = outputFileName;

    if (fs.existsSync(outputFilePath)) {
      content = fs.readFileSync(outputFilePath, "utf-8");
    } else if (outputStyle === "mermaid" && fs.existsSync(svgFallback)) {
      content = fs.readFileSync(svgFallback, "utf-8");
      actualFileName = "generated.svg";
    } else {
      // Scan for any generated file
      const files = fs.readdirSync(outputDir);
      if (files.length > 0) {
        const firstFile = files[0];
        content = fs.readFileSync(path.join(outputDir, firstFile), "utf-8");
        actualFileName = firstFile;
      }
    }

    const isSvg = actualFileName.endsWith(".svg") || content.trimStart().startsWith("<svg") || /<svg[\s>]/.test(content);

    // Output result as JSON for the Go backend to parse
    console.log(
      JSON.stringify({
        success: true,
        content: content,
        style: outputStyle,
        isSvg: isSvg,
        fileName: actualFileName,
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
