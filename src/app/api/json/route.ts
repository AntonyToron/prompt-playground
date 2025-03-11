// app/api/json/route.ts
import { NextRequest, NextResponse } from "next/server";
import { compile } from "json-schema-to-typescript";

/**
 * Convert a JSON schema string to a TypeScript type definition
 * @param schemaString - JSON Schema as a string
 * @param typeName - Name for the generated TypeScript type
 * @returns Promise that resolves to a string containing the TypeScript type definition
 */
async function convertJsonSchemaToTypeScript(
  schemaString: string,
  typeName: string = "GeneratedType"
): Promise<string> {
  try {
    // Parse the schema string to a JSON object
    const schema = JSON.parse(schemaString);

    // Use json-schema-to-typescript to compile the schema
    const tsDefinition = await compile(schema, typeName, {
      bannerComment: "", // Remove the default banner comment
      style: {
        semi: true, // Add semicolons
        singleQuote: true, // Use single quotes
        tabWidth: 2, // 2 spaces for indentation
        trailingComma: "all", // Add trailing commas
      },

      // Enable these options to better handle complex schemas
      $refOptions: {
        resolve: {
          // Properly handle local references within the schema
          file: false,
          http: false,
          self: true,
        },
      },

      additionalProperties: true, // Be more permissive with additional properties

      // Enable handling of complex schema combinations
      strictIndexSignatures: false,
      unreachableDefinitions: true,
      unknownAny: false, // Improves handling of unknown types
      enableConstEnums: true, // Support for const enums
    });

    return tsDefinition;
  } catch (error) {
    throw new Error(`Failed to convert JSON schema to TypeScript: ${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { schema } = (await req.json()) as { schema: string };
    if (!schema) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tsDefinition = await convertJsonSchemaToTypeScript(schema);
    return NextResponse.json({ typescript: tsDefinition }, { status: 200 });
  } catch (error) {
    console.error("Error in json API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message || "Internal server error"
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
