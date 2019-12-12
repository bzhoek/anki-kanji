<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes" omit-xml-declaration="yes"/>


  <xsl:template match="svg">
    <svg width="240" height="240" viewBox="0 0 109 109">
      <style type="text/css">
        <![CDATA[
          text {
            font: 8pt sans-serif;
            stroke-width: 0pt;
            fill: #000000;
          }
          path {
            stroke: #00bb00;
            stroke-width: 4pt;
            fill:   #ffffff;
            fill-opacity: 0;
          }
          #stroke-1 {
            stroke: #E8ECFB;
          }
          #stroke-2 {
            stroke: #D9CCE3;
          }
          #stroke-3 {
            stroke: #CAACCB;
          }
          #stroke-4 {
            stroke: #BA8DB4;
          }
          #stroke-5 {
            stroke: #AA6F9E;
          }
          #stroke-6 {
            stroke: #994F88;
          }
          #stroke-7 {
            stroke: #882E72;
          }
          #stroke-8 {
            stroke: #7BAFDE;
          }
          #stroke-9 {
            stroke: #6195CF;
          }
          #stroke-10 {
            stroke: #437DBF;
          }
          #stroke-11 {
            stroke: #1965B0;
          }
          #stroke-12 {
            stroke: #CAE0AB;
          }
          #stroke-13 {
            stroke: #90C987;
          }
          #stroke-14 {
            stroke: #4EB265;
          }
          #stroke-15 {
            stroke: #F7F056;
          }
          #stroke-16 {
            stroke: #F7CB45;
          }
          #stroke-17 {
            stroke: #F4A736;
          }
          #stroke-18 {
            stroke: #EE8026;
          }
          #stroke-19 {
            stroke: #E65518;
          }
          #stroke-20 {
            stroke: #DC050C;
          }
          #stroke-21 {
            stroke: #A5170E;
          }
          #stroke-22 {
            stroke: #72190E;
          }
          #stroke-23 {
            stroke: #42150A;
          }
        ]]>
      </style>
      <xsl:apply-templates/>
    </svg>
  </xsl:template>

  <xsl:template match="path|text">
    <xsl:element name="{local-name()}">
      <xsl:for-each select="@*">
        <xsl:if test="substring-before(name(), ':') != 'kvg' and local-name() != 'style' and local-name() != 'id'">
          <xsl:attribute name="{local-name()}">
            <xsl:value-of select="."/>
          </xsl:attribute>
        </xsl:if>
        <xsl:attribute name="id">
          <xsl:value-of select="concat('stroke-', count(.|preceding::path))"/>
        </xsl:attribute>
      </xsl:for-each>
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>
</xsl:stylesheet>
