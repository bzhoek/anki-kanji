<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:svg="http://www.w3.org/2000/svg"
                xmlns:kvg="http://kanjivg.tagaini.net">
  <xsl:output method="xml" omit-xml-declaration="yes"/>
  <xsl:strip-space elements="*"/>
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="svg:g[contains(@id, 'Numbers')]"/>
  <xsl:template match="comment()"/>
  <xsl:template match="@id"/>
  <xsl:template match="@style">
    <xsl:attribute name="style">fill:none;stroke:red;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;</xsl:attribute>
  </xsl:template>
  <xsl:template match="@contentScriptType|@contentStyleType"/>
  <xsl:template match="@kvg:*"/>
</xsl:stylesheet>