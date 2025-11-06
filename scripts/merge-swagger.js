const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

const openapiPath = path.resolve(__dirname, '../src/swagger/openapi.yaml');
const routesPath = path.resolve(__dirname, '../src/swagger/routes.yaml');
const outputPath = path.resolve(__dirname, '../src/swagger.yaml');

try {
  // openapi.yaml 로드
  const openapi = YAML.load(openapiPath);
  
  // routes.yaml 로드
  const routes = YAML.load(routesPath);
  
  // routes.yaml의 경로들을 paths 섹션으로 변환
  openapi.paths = routes || {};
  
  // routes.yaml의 $ref를 절대 참조로 변경
  function fixRefs(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(fixRefs);
    }
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '$ref' && typeof value === 'string') {
        // "./openapi.yaml#/..." 형태를 "#/..."로 변경
        result[key] = value.replace(/^\.\/openapi\.yaml#/, '#');
      } else {
        result[key] = fixRefs(value);
      }
    }
    return result;
  }
  
  openapi.paths = fixRefs(openapi.paths);
  
  // YAML로 변환하여 저장 (인덴트 2로 설정)
  const yamlString = YAML.stringify(openapi, 10, 2);
  fs.writeFileSync(outputPath, yamlString, 'utf8');
  
  console.log('✅ Swagger 파일 병합 완료:', outputPath);
  console.log(`   - 경로 개수: ${Object.keys(openapi.paths || {}).length}개`);
} catch (error) {
  console.error('❌ Swagger 파일 병합 실패:', error.message);
  process.exit(1);
}

