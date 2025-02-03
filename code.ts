// Define theme suffixes
const themeASuffix = "Gradients - JioHotstar";
const themeBSuffix = "Gradients - Disney+ Hotstar";

// Function to recursively process nodes with proper typing
async function processNode(node: SceneNode) {
    if (node.type === 'GROUP') {
        // Process group children recursively
        for (const child of node.children) {
            await processNode(child);
        }
        return;
    }

    // Process fills for non-group nodes
    if ('fills' in node) {
        const currentStyleId = node.fillStyleId;

        if (typeof currentStyleId === 'string') {
            // Use async method to get the style
            const currentStyle = await figma.getStyleByIdAsync(currentStyleId);
            if (currentStyle) {
                console.log(`Current Style: ${currentStyle.name}`); // Debugging log

                // Construct new theme name based on current style
                let newThemeName = '';
                if (currentStyle.name.includes(themeASuffix)) {
                    newThemeName = currentStyle.name.replace(themeASuffix, themeBSuffix);
                } else if (currentStyle.name.includes(themeBSuffix)) {
                    newThemeName = currentStyle.name.replace(themeBSuffix, themeASuffix);
                }

                console.log(`Constructed New Theme Name: ${newThemeName}`); // Log constructed name

                // Use async method to get local paint styles
                const localStyles = await figma.getLocalPaintStylesAsync();
                
                // Log all local paint styles for debugging
                console.log('Available Local Paint Styles:');
                localStyles.forEach(style => console.log(`- ${style.name}`));

                // Attempting to find the new style by name
                const newStyle = localStyles.find(s => s.name === newThemeName);
                
                if (newStyle) {
                    await node.setFillStyleIdAsync(newStyle.id); // Set to new style ID
                    console.log(`Switched from ${currentStyle.name} to ${newThemeName}`); // Log successful switch
                } else {
                    console.error(`No Paint Style found for ${newThemeName}.`);
                    console.log(`Checking for applied fills...`);

                    // If not found, log applied fills directly
                    const fills = node.fills as readonly Paint[];  // Type assertion here
                    fills.forEach((fill, index) => {
                        if (fill.type === 'SOLID') {
                            const solidFill = fill as SolidPaint;  // Type assertion for SolidPaint
                            console.log(`Fill ${index}: Type: ${solidFill.type}, Color: ${JSON.stringify(solidFill.color)}, Opacity: ${solidFill.opacity}`);
                        } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
                            const gradientFill = fill as GradientPaint;  // Type assertion for GradientPaint
                            console.log(`Fill ${index}: Type: ${gradientFill.type}, Gradient Stops: ${JSON.stringify(gradientFill.gradientStops)}`);
                        } else if (fill.type === 'IMAGE') {
                            const imageFill = fill as ImagePaint;  // Type assertion for ImagePaint
                            console.log(`Fill ${index}: Type: ${imageFill.type}, Image Hash: ${imageFill.imageHash}`);
                        } else {
                            console.log(`Fill ${index}: Type: ${fill.type}, Other Properties: ${JSON.stringify(fill)}`);
                        }
                    });
                }
            } else {
                console.error(`Could not find style with ID: ${currentStyleId}`);
            }
        } else {
            console.log(`No fill style ID found for node.`);
        }
    }

    // Recursively process children for container nodes
    if ('children' in node) {
        for (const child of node.children) {
            await processNode(child);
        }
    }
}

// Main function with proper document traversal
async function main() {
    const selection = figma.currentPage.selection;

    if (selection.length > 0) {
        for (const node of selection) {
            await processNode(node); // Switch themes for selected nodes
        }
        figma.notify('🎨 Theme switched for selection!');
    } else {
        // Process entire document correctly
        for (const page of figma.root.children) {
            if (page.type === 'PAGE') {
                for (const child of page.children) {
                    await processNode(child); // Switch themes for all nodes in the document
                }
            }
        }
        figma.notify('🌈 Full document theme switched!');
    }

    figma.closePlugin();
}

// Execute
main();