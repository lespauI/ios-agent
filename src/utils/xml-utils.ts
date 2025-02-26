// src/utils/xml-utils.ts
/**
 * Truncates XML to fit within token limits for LLM requests
 * 
 * @param xml The original XML string
 * @param maxLength Maximum character length to keep (approximate token limit)
 * @returns Truncated XML with a note about truncation
 */
export function truncateXML(xml: string, maxLength: number = 50000): string {
    if (xml.length <= maxLength) {
      return xml;
    }
    
    // Find a good point to truncate (at a closing tag)
    const truncationPoint = xml.lastIndexOf('>', maxLength);
    if (truncationPoint === -1 || truncationPoint < maxLength / 2) {
      // If we can't find a good truncation point, just cut at maxLength
      return xml.substring(0, maxLength) + 
        '\n\n[XML truncated due to length. Showing first ' + maxLength + ' characters out of ' + xml.length + ']';
    }
    
    return xml.substring(0, truncationPoint + 1) + 
      '\n\n[XML truncated due to length. Showing first ' + truncationPoint + ' characters out of ' + xml.length + ']';
  }
  
  /**
   * Extracts the most relevant parts of the XML hierarchy
   * 
   * @param xml The original XML string
   * @returns A simplified version of the XML focusing on interactive elements
   */
  export function extractRelevantXML(xml: string): string {
    // This is a simplified approach - in a real implementation, you might want to
    // use a proper XML parser to extract only relevant elements
    
    // Focus on interactive elements that users typically interact with
    const relevantElements = [
      'XCUIElementTypeButton',
      'XCUIElementTypeTextField',
      'XCUIElementTypeSecureTextField',
      'XCUIElementTypeSearchField',
      'XCUIElementTypeCell',
      'XCUIElementTypeLink',
      'XCUIElementTypeSwitch',
      'XCUIElementTypeToggle',
      'XCUIElementTypeSlider',
      'XCUIElementTypeImage',
      'XCUIElementTypeStaticText',
      'XCUIElementTypeTextView',
      'XCUIElementTypeTable',
      'XCUIElementTypeCollectionView',
      'XCUIElementTypeScrollView',
      'XCUIElementTypeNavigationBar',
      'XCUIElementTypeTabBar',
      'XCUIElementTypeToolbar'
    ];
    
    // Create a regex pattern to match these elements
    const pattern = new RegExp(`<(${relevantElements.join('|')})([^>]*)>`, 'g');
    
    // Extract matches with their attributes
    const matches = [...xml.matchAll(pattern)];
    
    if (matches.length === 0) {
      // If no relevant elements found, return truncated original
      return truncateXML(xml);
    }
    
    // Rebuild a simplified XML with just the relevant elements
    let simplified = '<XCUIElementTypeApplication>\n';
    for (const match of matches) {
      simplified += `  <${match[1]}${match[2]}>\n`;
    }
    simplified += '</XCUIElementTypeApplication>\n';
    
    // Add a note about simplification
    simplified += '\n[XML simplified to focus on interactive elements. Original length: ' + xml.length + ' characters]';
    
    return simplified;
  }
  