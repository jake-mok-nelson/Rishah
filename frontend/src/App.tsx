import { useEffect, useState } from "react";
import { Editor, Tldraw, hardReset,parseTldrawJsonFile,createTLSchema, TLUiOverrides, TLComponents, useTools, useIsToolSelected,
   DefaultToolbar, TldrawUiMenuItem, DefaultToolbarContent, TLUiAssetUrlOverrides,
   defaultHandleExternalTldrawContent,TLTldrawExternalContent,AssetRecordType,useReactor,
   DefaultDashStyle, DefaultFontStyle
  } from 'tldraw'
import 'tldraw/tldraw.css'
import './App.css'
import {
  GetStartupFileContent,
  OpenFileDialog,
  SaveFileDialog,
  SaveFileDialogForExport,
  ReadFile,
  WriteFile,
  WriteFileBase64,
  AskDialog,
  InfoDialog,
  SetTitle,
  GenerateImageWithAI,
  SelectDirectoryDialog,
} from '../wailsjs/go/main/App'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { message } from 'antd';
import { shapeButtons } from "./components/tldraw/shapeButtons";
import { IconsTool } from './components/tldraw/IconButton'
import iconS from './assets/pen-tool.png'
import { CustomStylePanel } from "./components/tldraw/customStylePanel";
import { initializeUserPreferences, saveUserPreferences, saveInstanceState, loadInstanceState } from "./utils/settingsManager";


 export const customAssetUrls: TLUiAssetUrlOverrides = {
	icons: {
		'toolbox-icons': iconS,
	},
}

const customTools = [IconsTool]

function App() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const defaultFileName = 'drawing';

const uiOverrides: TLUiOverrides = {
	tools(editor, tools) {
		// Create a tool item in the ui's context.
		tools.icons = {
			id: 'icons',
			icon: 'toolbox-icons',
			label: 'Icons',
			onSelect: () => {
				editor.setCurrentTool('icons')
			},
		}
		return tools
	},
}


const components: TLComponents = {
	Toolbar: (props) => {
		const tools = useTools()
		const isIconsSelected = useIsToolSelected(tools['icons'])
		return (
			<DefaultToolbar {...props}>
        <TldrawUiMenuItem {...tools['icons']} isSelected={isIconsSelected}/>
				<DefaultToolbarContent />
        
			</DefaultToolbar>
		)
	}
}



  const success = () => {
    messageApi.open({
      type: 'success',
      content: 'Saved successfully',
    });
  };


  useEffect(() => {
     const fetchData = async () => {

      const result: string[] | null = await GetStartupFileContent();
      if(!result || !result[0] || !result[1]) return;

      await loadTldrawFile(result[1],result[0]);
     }
    fetchData()
  }, [editor]);


useReactor(
  'save-grid-mode',
  () => {
    if (!editor) return;

    const isGridMode = editor.getInstanceState().isGridMode;
    saveInstanceState({ isGridMode });
  },
  [editor]
);

useReactor(
  'save-user-preferences',
  () => {
    if (!editor) return;
    const userPrefs = editor.user.getUserPreferences();
    saveUserPreferences(userPrefs);
  },
  [editor]
);

  // Disable context menu
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('contextmenu', disableContextMenu);
    
    return () => {
      window.removeEventListener('contextmenu', disableContextMenu);
    };
  }, []);

  // Listen for menu events from Wails backend
  useEffect(() => {
    const cleanupNew = EventsOn('menu-new', () => {
      handleNew();
    });
    const cleanupOpen = EventsOn('menu-open', () => {
      handleOpen();
    });
    const cleanupSave = EventsOn('menu-save', () => {
      handleSave();
    });
    const cleanupSaveAs = EventsOn('menu-save-as', () => {
      handleSaveAs();
    });
    const cleanupAbout = EventsOn('menu-about', () => {
      handleAbout();
    });
    const cleanupExportPng = EventsOn('menu-export-as-png', () => {
      handleExport('png');
    });
    const cleanupExportSvg = EventsOn('menu-export-as-svg', () => {
      handleExport('svg');
    });
    const cleanupGenerateAI = EventsOn('menu-generate-ai', () => {
      handleGenerateAI();
    });

    return () => {
      cleanupNew();
      cleanupOpen();
      cleanupSave();
      cleanupSaveAs();
      cleanupAbout();
      cleanupExportPng();
      cleanupExportSvg();
      cleanupGenerateAI();
    };
  }, [currentFilePath, editor]);

  
    //Handle Ctrl+S and Ctrl+Shift+S keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = async (e:any) => {
        // Check for Ctrl+Shift+S or Cmd+Shift+S (Save As)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSaveAs();
          return;
        }
        
        // Check for Ctrl+S or Cmd+S (Save)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSave();
          return;
        }
      };
  
      // Add event listener
      window.addEventListener('keydown', handleKeyDown);
      
      // Cleanup: remove event listener
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [currentFilePath,editor]); // Include currentFilePath in dependencies

  // Update window title when file path changes
  useEffect(() => {
    const updateTitle = async () => {
      if (currentFilePath) {
        const filename = currentFilePath.split('/').pop() || currentFilePath.split('\\').pop();
        await SetTitle(`Rishah - ${filename}`);
      } else {
        await SetTitle('Rishah - Untitled');
      }
    };
    
    updateTitle();
  }, [currentFilePath]);
  
    async function handleSave(){
    try {
      console.log(editor)
      if (!editor) return;

      const DataToSave = await prepareFileForSave()
      console.log(DataToSave)
      if(!DataToSave) return;
  
      if(currentFilePath){
        await WriteFile(currentFilePath, DataToSave);
        success();
        return;
      }

      // Use Wails dialog to let the user choose where to save the file
      const savePath = await SaveFileDialog(`${defaultFileName}.tldr`);
      
      // If the user cancelled the dialog, savePath will be empty
      if (!savePath) return;
      
      // Write the tldraw file to the selected location
      await WriteFile(savePath, DataToSave);
      setCurrentFilePath(savePath);

      
      console.log(`File saved successfully to: ${savePath}`);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  async function handleSaveAs(){
    try {
      console.log(editor)
      if (!editor) return;

      const DataToSave = await prepareFileForSave()
      console.log(DataToSave)
      if(!DataToSave) return;

      // Use Wails dialog to let the user choose where to save the file
      const savePath = await SaveFileDialog(`${defaultFileName}.tldr`);
      
      // If the user cancelled the dialog, savePath will be empty
      if (!savePath) return;
      
      // Write the tldraw file to the selected location
      await WriteFile(savePath, DataToSave);
      setCurrentFilePath(savePath);

      success();
      
      console.log(`File saved successfully to: ${savePath}`);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  async function prepareFileForSave(){
    if (!editor) return;
    const exportedContent = editor?.getSnapshot();
    const store = exportedContent.document.store
    const schema = exportedContent.document.schema
    let records = [];
		for (const record of Object.values(store)) {
      console.log(record)
      records.push(record);
		}
		const body = JSON.stringify(
				{
					schema: schema,
					records: records,
          tldrawFileFormatVersion:1
				}
      )

    return body;
  }

  const promptSaveCurrentFile = async () => {
    const answer = await AskDialog('Save Current File', 'Would you like to save the current file?');
    
    if(answer){
      await handleSave();
    }
  };

  const handleOpen = async () =>{
    try {
      await promptSaveCurrentFile();
      
      // Open file dialog, filter for .tldr files
      const selected = await OpenFileDialog();

      if(!selected)
        return;

      const fileContent:string = await ReadFile(selected);
      await loadTldrawFile(fileContent,selected)


    } catch (error) {
      alert("was not able to open the file. the tldr version is mismatch with app version.please download latest version")
      console.error('Error opening file:', error);
    }
  }

  const loadTldrawFile = async (data:string,path:string) => {
    if (!editor) return;
    const parseFileResult = parseTldrawJsonFile({ json: data, schema: createTLSchema() });
    console.log(parseFileResult)
    // @ts-ignore
    const snapshot = parseFileResult.value.getStoreSnapshot()
    editor.loadSnapshot(snapshot)
    setCurrentFilePath(path)
  }

  const handleNew = async () =>{
    try {
      await promptSaveCurrentFile();

      if (editor) {
        editor.dispose();
      }

      hardReset({shouldReload:true})
     
      
    } catch (error) {
      console.error('Error opening file:', error);
    }
  }

  const handleAbout = async () => {
    try {
      await InfoDialog('About Rishah', 'Rishah v0.6.1\n\nA modern drawing and diagramming application built with Wails and TLDraw.\n\n© 2025 Rishah Team');
    } catch (error) {
      console.error('Error showing about dialog:', error);
    }
  }

  const handleExport = async (format: 'png' | 'svg') => {
    try {
      if (!editor) return;

      const shapes = editor.getCurrentPageShapeIds();
      if (shapes.size === 0) {
        await InfoDialog('Export', 'There are no shapes to export.');
        return;
      }

      const defaultName = `${defaultFileName}.${format}`;
      const savePath = await SaveFileDialogForExport(defaultName, format);
      if (!savePath) return;

      const { blob } = await editor.toImage([...shapes], { format });

      if (format === 'svg') {
        // SVG is text-based, read as text and write directly
        const text = await blob.text();
        await WriteFile(savePath, text);
      } else {
        // Binary formats (png, jpeg, webp): convert blob to base64
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
        const base64Data = btoa(binary);
        await WriteFileBase64(savePath, base64Data);
      }

      messageApi.open({
        type: 'success',
        content: `Exported successfully as ${format.toUpperCase()}`,
      });
      console.log(`File exported successfully to: ${savePath}`);
    } catch (error) {
      console.error('Error exporting file:', error);
      messageApi.open({
        type: 'error',
        content: `Failed to export as ${format.toUpperCase()}`,
      });
    }
  }

  const handleGenerateAI = async () => {
    try {
      if (!editor) return;

      const shapes = editor.getCurrentPageShapeIds();
      if (shapes.size === 0) {
        await InfoDialog('Generate Image with AI', 'There are no shapes to generate from.');
        return;
      }

      // Let the user pick an output directory
      const outputDir = await SelectDirectoryDialog();
      if (!outputDir) return;

      messageApi.open({
        type: 'loading',
        content: 'Generating styled images with AI... This may take a moment.',
        duration: 0,
        key: 'ai-generate',
      });

      // Export canvas as PNG for AI input
      const { blob } = await editor.toImage([...shapes], { format: 'png' });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
      const base64Data = btoa(binary);

      // Call the Go backend to run copilot-sdk generation
      const resultJSON = await GenerateImageWithAI(base64Data, 'all');
      const result = JSON.parse(resultJSON);

      messageApi.destroy('ai-generate');

      if (result.success && result.files && result.files.length > 0) {
        messageApi.open({
          type: 'success',
          content: `Generated ${result.files.length} file(s) in ${outputDir}`,
        });
      } else if (result.success) {
        messageApi.open({
          type: 'info',
          content: `AI generation completed. Check ${outputDir} for output files.`,
        });
      } else {
        messageApi.open({
          type: 'error',
          content: result.error || 'AI generation failed',
        });
      }
    } catch (error) {
      messageApi.destroy('ai-generate');
      console.error('Error generating AI image:', error);
      messageApi.open({
        type: 'error',
        content: 'Failed to generate image with AI. Ensure the Copilot CLI and Node.js are installed.',
      });
    }
  }


  function handleCustomTldrawPaste(editor: Editor, { content, point }: TLTldrawExternalContent) {
    console.log(content)
    console.log(point)
    let a = content.shapes.filter((v) => v.meta?.type != null)
    if(!a) return;

    a.forEach(b => {
      // @ts-ignore
      let currentAssetId = b.props?.assetId
      let getCurrentAsset = content.assets.filter((v) => v.id ==  currentAssetId)[0]
      console.log(getCurrentAsset)

      const assetId = AssetRecordType.createId()
      editor.createAssets([
        {
          ...getCurrentAsset,
          id: assetId,
        }
      ]);

      // @ts-ignore
      b.props.assetId = assetId;

    });

    defaultHandleExternalTldrawContent(editor, { content, point })
		return
    
}



  return (
    <main className="container">
          {contextHolder}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>


        <Tldraw
          onMount={(editor) => {
            if(!editor) return;
            setEditor(editor)

            // Set default styles for enhanced rough sketch look
            editor.setStyleForNextShapes(DefaultDashStyle, 'draw')
            editor.setStyleForNextShapes(DefaultFontStyle, 'draw')

            // Load and apply saved preferences
            initializeUserPreferences().then(savedPrefs => {
              editor.user.updateUserPreferences(savedPrefs);
            });

            // Load and apply saved instance state (grid mode)
            loadInstanceState().then(savedInstanceState => {
              if (savedInstanceState) {
                editor.updateInstanceState({ isGridMode: savedInstanceState.isGridMode });
              }
            });

            editor.registerExternalContentHandler('tldraw', (content) =>{
              handleCustomTldrawPaste(editor,content);
            })
          }}
          tools={customTools}
          overrides={uiOverrides}
          components={{...components,...shapeButtons,StylePanel:CustomStylePanel}}
          assetUrls={customAssetUrls}
          licenseKey={import.meta.env.VITE_TLDRAW_LICENSE}
         />
         
    </div>
  
    </main>
  );
  
}

export default App;
