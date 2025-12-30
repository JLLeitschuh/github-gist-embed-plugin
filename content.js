(function() {
  'use strict';

  // Extract username and gist ID from URL
  function getGistInfo() {
    const urlMatch = window.location.pathname.match(/^\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) return null;
    return {
      username: urlMatch[1],
      gistId: urlMatch[2]
    };
  }

  // Get filename from file header or button context
  function getFilename(fileElement, rawButton) {
    // First, try to extract from the Raw button's href
    if (rawButton && rawButton.href) {
      const match = rawButton.href.match(/\/raw\/[^\/]+\/(.+?)(?:\?|$)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    
    // Try to find the filename in the file header
    const fileHeader = fileElement.querySelector('.file-header, [class*="file-header"]');
    if (fileHeader) {
      // Try various selectors for filename
      const filenameElement = fileHeader.querySelector('.file-info a, .file-info strong, a[href*="/blob/"], [data-tagsearch-path]');
      if (filenameElement) {
        const filename = filenameElement.textContent.trim() || filenameElement.getAttribute('data-tagsearch-path');
        if (filename) {
          return filename;
        }
      }
    }
    
    // Fallback: try to find it from data attributes
    const dataPath = fileElement.getAttribute('data-tagsearch-path');
    if (dataPath) {
      return dataPath;
    }
    
    return null;
  }

  // Create the Copy Embed button
  function createCopyButton(filename, gistInfo) {
    const button = document.createElement('button');
    button.className = 'Button--secondary Button--small Button copy-embed-btn';
    button.type = 'button';
    button.setAttribute('data-view-component', 'true');
    
    // Create the nested structure matching GitHub's button format
    const buttonContent = document.createElement('span');
    buttonContent.className = 'Button-content';
    
    const buttonLabel = document.createElement('span');
    buttonLabel.className = 'Button-label';
    buttonLabel.textContent = 'Copy Embed';
    
    buttonContent.appendChild(buttonLabel);
    button.appendChild(buttonContent);
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const embedUrl = `https://gist.github.com/${gistInfo.username}/${gistInfo.gistId}?file=${encodeURIComponent(filename)}`;
      
      try {
        await navigator.clipboard.writeText(embedUrl);
        
        // Visual feedback: temporarily change button text
        const originalText = buttonLabel.textContent;
        buttonLabel.textContent = 'Copied!';
        button.style.color = '#0969da';
        
        setTimeout(() => {
          buttonLabel.textContent = originalText;
          button.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback: show alert
        alert(`Embed URL: ${embedUrl}`);
      }
    });
    
    return button;
  }

  // Process a single file section
  function processFileSection(fileElement, gistInfo) {
    // Check if button already exists in this file section or its parent
    const existingButton = fileElement.querySelector('.copy-embed-btn') || 
                          fileElement.closest('.file, .gist-file, [class*="file"]')?.querySelector('.copy-embed-btn');
    if (existingButton) {
      return;
    }

    // Find the Raw button - try multiple selectors
    let rawButton = fileElement.querySelector('a[href*="/raw/"]');
    if (!rawButton) {
      // Try finding in file header
      const fileHeader = fileElement.querySelector('.file-header, [class*="file-header"]');
      if (fileHeader) {
        rawButton = fileHeader.querySelector('a[href*="/raw/"]');
      }
    }
    if (!rawButton) {
      // Try finding by text content
      const allLinks = fileElement.querySelectorAll('a');
      for (const link of allLinks) {
        if (link.textContent.trim().toLowerCase() === 'raw' && link.href.includes('/raw/')) {
          rawButton = link;
          break;
        }
      }
    }
    if (!rawButton) {
      return;
    }

    // Get the filename
    const filename = getFilename(fileElement, rawButton);
    if (!filename) {
      return;
    }

    // Find the button container - GitHub may use different container structures
    let buttonContainer = rawButton.parentElement;
    
    // Create and insert the Copy Embed button before the Raw button
    const copyButton = createCopyButton(filename, gistInfo);
    buttonContainer.insertBefore(copyButton, rawButton);
  }

  // Process all file sections on the page
  function processAllFiles() {
    const gistInfo = getGistInfo();
    if (!gistInfo) {
      return;
    }

    // Find all file sections - try multiple selectors
    let fileSections = document.querySelectorAll('.file, .gist-file, [data-tagsearch-path]');
    
    // If no file sections found with those selectors, try finding by Raw button presence
    if (fileSections.length === 0) {
      const rawButtons = document.querySelectorAll('a[href*="/raw/"]');
      const sections = new Set();
      rawButtons.forEach(button => {
        const fileSection = button.closest('.file, .gist-file, [class*="file"], [data-tagsearch-path], .Box');
        if (fileSection) {
          sections.add(fileSection);
        }
      });
      fileSections = Array.from(sections);
    }
    
    fileSections.forEach(fileElement => {
      processFileSection(fileElement, gistInfo);
    });
  }

  // Initialize on page load
  function init() {
    // Process files immediately
    processAllFiles();

    // Watch for dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });
      
      if (shouldProcess) {
        // Debounce to avoid excessive processing
        clearTimeout(init.processTimeout);
        init.processTimeout = setTimeout(processAllFiles, 100);
      }
    });

    // Observe the main gist container
    const gistContainer = document.querySelector('.gist, .repository-content, main');
    if (gistContainer) {
      observer.observe(gistContainer, {
        childList: true,
        subtree: true
      });
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

