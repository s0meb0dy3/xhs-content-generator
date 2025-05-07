import React, { useState, useEffect } from 'react';
import { Input, Button, Card, List, message, Layout, Typography, Divider, Space, Tooltip, Modal, Select, Tag, Empty, Form } from 'antd';
import { SearchOutlined, CopyOutlined, ThunderboltOutlined, StarOutlined, HeartOutlined, InfoCircleOutlined, EditOutlined, SaveOutlined, CloseOutlined, QuestionCircleOutlined, HistoryOutlined, DeleteOutlined, RollbackOutlined, FilterOutlined, SendOutlined, RobotOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { CozeAPI } from '@coze/api';
import ReactMarkdown from 'react-markdown';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function App() {
  const [school, setSchool] = useState('');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [apiInfo, setApiInfo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [style, setStyle] = useState('normal');
  const [customStyle, setCustomStyle] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [history, setHistory] = useState([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ school: '', style: '' });
  const [reportTitle, setReportTitle] = useState('');
  // 推送小程序相关状态
  const [isPushModalVisible, setIsPushModalVisible] = useState(false);
  const [currentPushContent, setCurrentPushContent] = useState(null);
  const [pushForm] = Form.useForm();
  const [pushLoading, setPushLoading] = useState(false);
  // AI修改相关状态
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiModifyModalVisible, setIsAiModifyModalVisible] = useState(false);
  const [aiModifyOriginalContent, setAiModifyOriginalContent] = useState('');
  const [aiModifyResult, setAiModifyResult] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [editingAiModifyOriginal, setEditingAiModifyOriginal] = useState('');
  // 添加爬取文案排序状态
  const [crawlSortType, setCrawlSortType] = useState('default'); // 默认、热度（点赞数）、时间
  const [crawlResults, setCrawlResults] = useState([]); // 存储爬取的原始数据，用于排序
  // 添加图片放大查看相关状态
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  // 添加图片选择相关状态
  const [isImageSelectorVisible, setIsImageSelectorVisible] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  
  // 工作区状态
  const [originalText, setOriginalText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [generatedText, setGeneratedText] = useState('');  // 新增生成结果状态
  const [titleText, setTitleText] = useState('');
  const [contentText, setContentText] = useState('');
  const [workspaceImages, setWorkspaceImages] = useState([]); // 新增工作区图片列表
  
  // 预设学校列表
  const schoolOptions = [
    '中山大学',
    '华南理工大学',
    '华南师范大学',
    '广州大学',
    '广东外语外贸大学',
    '广州中医药大学',
    '广东药科大学',
    '广东工业大学',
    '广州美术学院',
    '星海音乐学院',
    '暨南大学',
    '广州医科大学',
    '华南农业大学',
    '广东白云学院',
    '广东财经大学',
    '广东技术师范大学',
    '广东金融学院',
    '广州航海学院',
    '广东第二师范学院',
    '南国商学院',
    '广州华商学院',
    '南方医科大学',
    '广州城市理工学院'
  ];

  // 处理学校选择变化
  const handleSchoolChange = (value) => {
    setSchool(value);
  };
  
  // 在组件加载时从本地存储加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('contentHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('解析历史记录失败:', e);
      }
    }
  }, []);

  // 保存历史记录到本地存储
  useEffect(() => {
    if (history.length > 0) {
      try {
        // 优化历史记录，删除过大的数据以避免超出存储配额
        const optimizedHistory = history.map(item => {
          // 创建一个新对象，避免修改原始数据
          const optimizedItem = { ...item };
          
          // 如果存在originalData且包含image_list，对其进行处理
          if (optimizedItem.originalData) {
            // 限制原始数据数量，最多保留10条
            if (optimizedItem.originalData.length > 10) {
              optimizedItem.originalData = optimizedItem.originalData.slice(0, 10);
            }
            
            // 处理每条数据中的image_list，移除以避免存储过大
            optimizedItem.originalData = optimizedItem.originalData.map(data => {
              const newData = { ...data };
              // 不存储图片列表，只保留是否有图片的标记
              if (newData.image_list) {
                newData.has_images = true;
                delete newData.image_list;
              }
              return newData;
            });
          }
          
          // 限制报告HTML大小
          if (typeof optimizedItem.report === 'string' && optimizedItem.report.length > 5000) {
            optimizedItem.report = optimizedItem.report.substring(0, 5000) + '... (内容已截断)';
          }
          
          // 限制contents数组大小
          if (optimizedItem.contents && optimizedItem.contents.length > 5) {
            optimizedItem.contents = optimizedItem.contents.slice(0, 5);
          }
          
          return optimizedItem;
        });
        
        // 限制历史记录数量，最多保存20条
        const limitedHistory = optimizedHistory.slice(0, 20);
        
        // 尝试存储，如果失败则进一步减少数据量
        const historyString = JSON.stringify(limitedHistory);
        try {
          localStorage.setItem('contentHistory', historyString);
        } catch (e) {
          console.warn('存储历史记录失败，尝试进一步减少数据量:', e);
          
          // 如果失败，进一步限制历史记录数量
          const furtherLimitedHistory = limitedHistory.slice(0, 10);
          
          // 移除更多可能占用空间的字段
          const minimalHistory = furtherLimitedHistory.map(item => ({
            id: item.id,
            timestamp: item.timestamp,
            school: item.school,
            style: item.style,
            contents: item.contents ? item.contents.slice(0, 3) : []
          }));
          
          try {
            localStorage.setItem('contentHistory', JSON.stringify(minimalHistory));
            console.log('成功存储精简的历史记录');
          } catch (storageError) {
            console.error('无法存储历史记录，即使精简后也超出配额:', storageError);
            // 完全失败时，显示消息给用户
            message.warning('无法保存历史记录，本地存储空间已满');
          }
        }
      } catch (e) {
        console.error('处理历史记录时出错:', e);
      }
    }
  }, [history]);

  // 文案风格选项
  const styleOptions = [
    { value: 'normal', label: '默认风格' },
    { value: 'formal', label: '正式风格' },
    { value: 'humorous', label: '幽默风趣' },
    { value: 'emotional', label: '情感共鸣' },
    { value: 'custom_prompt', label: '自定义提示词' }
  ];

  // 处理风格选择变化
  const handleStyleChange = (value) => {
    setStyle(value);
    if (value !== 'custom_prompt') {
      setCustomStyle('');
    }
  };

  // 处理文案格式
  const formatContent = (text) => {
    // 处理文本格式
    return text
      .replace(/\n{3,}/g, '\n\n')  // 三个及以上的换行符替换
      .trim();  // 移除首尾空白
  };

  const handleGenerate = async () => {
    if (!school) {
      message.error('请先选择或输入学校名称');
      return;
    }
    
    setReportTitle('autoGML报告展示');
    setLoading(true);
    try {
      console.log('开始调用API...');
      console.log('请求参数:', {
        parameters: {
          input: school,
          style: style === 'custom_prompt' ? customStyle : style
        },
        workflow_id: '7496428183575904307'
      });
      
      // 调用 Coze API
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            input: school,
            style: style === 'custom_prompt' ? customStyle : style
          },
          workflow_id: '7496428183575904307'
        })
      });

      console.log('API响应状态:', response.status);
      const result = await response.json();
      console.log('API响应数据:', result);
      
      // 处理 API 响应
      if (result.code === 0 && result.data) {
        try {
          console.log('开始解析API响应数据:', result.data);
          const data = JSON.parse(result.data);
          console.log('解析后的数据:', data);
          
          if (data.report && data.tiezi) {
            // 处理报告内容
            const reportContent = data.report;
            // 处理帖子内容
            const textArray = data.tiezi
              .split(/------/)  // 使用"------"字符串分割帖子
              .map(text => text.trim())
              .filter(text => {
                // 过滤掉空文本和纯英文数字的行
                const trimmedText = text.trim();
                return trimmedText && 
                       !trimmedText.match(/^[A-Za-z0-9\s]+$/);  // 过滤掉纯英文和数字的行
              })
              .map(formatContent);
            
            console.log('处理后的文案数组:', textArray);
            if (textArray.length > 0) {
              setContents(textArray);
              
              // 更新报告内容
              const historyItem = {
                id: Date.now(),
                timestamp: new Date().toLocaleString(),
                school: school,
                style: style === 'custom_prompt' ? customStyle : style,
                contents: textArray,
                report: reportContent
              };
              
              // 添加到历史记录，限制最多保存50条记录
              setHistory(prevHistory => {
                const newHistory = [historyItem, ...prevHistory];
                return newHistory.slice(0, 50);
              });
              
              setApiInfo({
                timestamp: new Date().toLocaleString(),
                request: {
                  input: school,
                  style: style === 'custom_prompt' ? customStyle : style,
                  workflow_id: '7496428183575904307'
                },
                response: result,
                status: '成功',
                report: reportContent
              });
              
              message.success('文案生成成功');
            } else {
              console.warn('分割后的文案数组为空');
              message.warning('未生成到文案，请重试');
            }
          } else {
            console.warn('API返回数据中没有report或tiezi字段');
            message.warning('未生成到文案，请重试');
          }
        } catch (error) {
          console.error('解析API响应失败:', error);
          console.error('原始数据:', result.data);
          message.error('解析响应失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未生成到文案，请重试');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      message.error('生成失败，请稍后重试');
      // 如果API调用失败，显示默认文案
      setContents([
        `🏫 ${school}的校园生活真的太美好了！每天都能感受到浓浓的学习氛围，图书馆里座无虚席，操场上充满活力，食堂的美食更是让人流连忘返～ #校园生活 #大学生活`,
        `🎓 ${school}的老师们都很专业，课堂氛围活跃，同学们互帮互助，在这里不仅能学到知识，还能收获珍贵的友谊！ #学习生活 #校园时光`,
        `🎓 ${school}的每一天都是新的开始！清晨的校园格外宁静，傍晚的夕阳映照着教学楼，一切都是那么美好🌞 #校园日常 #大学生活`
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 爬虫模式处理函数
  const handleCrawl = async () => {
    if (!school) {
      message.error('请先选择或输入学校名称');
      return;
    }
    
    setReportTitle('爬取文案展示');
    setCrawlLoading(true);
    try {
      message.info('开始爬取' + school + '的相关数据...');
      
      // 调用爬虫API
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            college_name: school
          },
          workflow_id: '7496379054380482599'
        })
      });

      console.log('爬虫API响应状态:', response.status);
      const result = await response.json();
      console.log('爬虫API响应数据:', result);
      
      // 处理API响应
      if (result.code === 0 && result.data) {
        try {
          console.log('开始解析爬虫API响应数据:', result.data);
          let data;
          if (typeof result.data === 'string') {
            data = JSON.parse(result.data);
          } else {
            data = result.data;
          }
          
          if (data.outputList && data.outputList.length > 0) {
            // 存储原始数据用于排序
            setCrawlResults(data.outputList);
            // 保存crawlResults到sessionStorage
            try {
              sessionStorage.setItem('crawlResults', JSON.stringify(data.outputList));
              console.log('已保存crawlResults到sessionStorage');
            } catch (e) {
              console.error('保存crawlResults到sessionStorage失败:', e);
            }
            // 重置排序类型
            setCrawlSortType('default');
            
            // 准备爬取内容，但不立即添加到contents
            const formattedResults = data.outputList.map(item => {
              // 使用API返回的title字段
              const title = item.title || '无标题';
              const content = item.content;
              // 添加原文链接
              const noteUrl = item.note_url ? `\n\n原文链接: ${item.note_url}` : '';
              // 添加上传时间，仅保留年月日
              let uploadTime = '';
              if (item.upload_time) {
                // 尝试提取日期部分（年月日）
                const dateMatch = item.upload_time.match(/\d{4}-\d{2}-\d{2}/);
                if (dateMatch) {
                  uploadTime = `\n\n发布时间: ${dateMatch[0]}`;
                } else {
                  // 如果格式不匹配，则保留原样
                  uploadTime = `\n\n发布时间: ${item.upload_time}`;
                }
              }
              
              return `🏫 ${school}小红书文案 - ${title}\n\n${content}${noteUrl}${uploadTime}`;
            });
            
            // 记录爬取结果，但不设置到contents
            window.crawledContents = formattedResults;
            // 保存到sessionStorage
            try {
              sessionStorage.setItem('crawledContents', JSON.stringify(formattedResults));
            } catch (e) {
              console.error('保存爬取内容到sessionStorage失败:', e);
            }
            
            // 生成爬取文案的HTML展示
            const reportHTML = generateCrawlResultsHTML(data.outputList, school);
            
            // 设置报告内容为HTML格式
            setApiInfo({
              timestamp: new Date().toLocaleString(),
              request: {
                college_name: school,
                workflow_id: '7496379054380482599'
              },
              response: result,
              status: '成功',
              report: reportHTML
            });
            
            // 添加到历史记录
            const historyItem = {
              id: Date.now(),
              timestamp: new Date().toLocaleString(),
              school: school,
              style: '爬虫模式',
              contents: formattedResults,
              report: reportHTML,
              originalData: data.outputList // 保存原始数据以便后续排序
            };
            
            setHistory(prevHistory => {
              const newHistory = [historyItem, ...prevHistory];
              return newHistory.slice(0, 50); // 限制最多保存50条记录
            });
            
            message.success('爬虫数据获取成功');
            
            // 添加复制到生成结果区的全局函数 (虽然左移按钮已移除，但保留此函数以防止引用错误)
            window.copyToResults = (index) => {
              // 如果存在排序后的索引映射，使用它来获取正确的索引
              const originalIndex = window.sortedIndexMap ? window.sortedIndexMap[index] : index;
              
              // 如果爬取结果存在
              if (window.crawledContents && window.crawledContents[originalIndex]) {
                // 获取原始文案内容
                let content = window.crawledContents[originalIndex];
                
                // 处理文案格式
                try {
                  // 1. 去掉前缀 "🏫 XX大学小红书文案 - "
                  content = content.replace(/^🏫[\s\S]*?小红书文案[\s\S]*?-\s*/g, '');
                  
                  // 2. 去掉原文链接和发布时间
                  content = content.replace(/\n\n原文链接:[\s\S]*?(?=\n\n|$)/g, '');
                  content = content.replace(/\n\n发布时间:[\s\S]*?(?=\n\n|$)/g, '');
                  
                  // 3. 清理可能残留的多余换行
                  content = content.replace(/\n{3,}/g, '\n\n');
                  content = content.trim();
                } catch (e) {
                  console.error('处理文案格式时出错:', e);
                }
                
                // 添加处理后的内容到生成区
                setContents(prev => [content, ...prev]);
                message.success('已添加到生成结果区');
              } else {
                message.error('找不到爬取内容');
              }
            };
            
            // 新增复制到工作区的函数
            window.copyToWorkspace = (index) => {
              console.log('调用copyToWorkspace，索引:', index);
              // 如果存在排序后的索引映射，使用它来获取正确的索引
              const originalIndex = window.sortedIndexMap ? window.sortedIndexMap[index] : index;
              console.log('原始索引:', originalIndex);
              console.log('爬取结果状态:', { 
                hasCrawlResults: !!crawlResults, 
                crawlResultsLength: crawlResults ? crawlResults.length : 0,
                hasCrawledContents: !!window.crawledContents,
                crawledContentsLength: window.crawledContents ? window.crawledContents.length : 0
              });
              
              // 如果爬取结果不存在，但从sessionStorage恢复
              if ((!crawlResults || crawlResults.length === 0) && sessionStorage.getItem('crawlResults')) {
                try {
                  const savedResults = JSON.parse(sessionStorage.getItem('crawlResults'));
                  if (savedResults && savedResults.length > 0) {
                    setCrawlResults(savedResults);
                    console.log('已从sessionStorage中恢复crawlResults');
                  }
                } catch (e) {
                  console.error('从sessionStorage恢复crawlResults失败:', e);
                }
              }
              
              // 如果crawledContents不存在，尝试从sessionStorage恢复
              if (!window.crawledContents && sessionStorage.getItem('crawledContents')) {
                try {
                  window.crawledContents = JSON.parse(sessionStorage.getItem('crawledContents'));
                  console.log('已从sessionStorage中恢复crawledContents');
                } catch (e) {
                  console.error('从sessionStorage恢复crawledContents失败:', e);
                }
              }
              
              // 如果爬取结果存在
              if (crawlResults && crawlResults[originalIndex]) {
                // 获取原始爬取结果数据
                const item = crawlResults[originalIndex];
                console.log('爬取结果项:', item);
                
                // 获取原始文案内容
                let content = window.crawledContents && window.crawledContents[originalIndex] ? 
                              window.crawledContents[originalIndex] : '';
                
                // 处理文案格式
                try {
                  // 提取标题
                  const titleMatch = content.match(/^🏫[\s\S]*?小红书文案[\s\S]*?-\s*(.*?)(?=\n\n|$)/);
                  let title = titleMatch ? titleMatch[1].trim() : '';
                  
                  // 提取内容
                  content = content.replace(/^🏫[\s\S]*?小红书文案[\s\S]*?-\s*.*?\n\n/g, '');
                  
                  // 去掉原文链接和发布时间
                  content = content.replace(/\n\n原文链接:[\s\S]*?(?=\n\n|$)/g, '');
                  content = content.replace(/\n\n发布时间:[\s\S]*?(?=\n\n|$)/g, '');
                  
                  // 清理可能残留的多余换行
                  content = content.replace(/\n{3,}/g, '\n\n');
                  content = content.trim();
                  
                  // 将标题和内容合并设置到原文文本框
                  const combinedText = title ? `${title}\n\n${content}` : content;
                  setOriginalText(combinedText);
                  
                  message.success('已复制到工作区');
                } catch (e) {
                  console.error('处理文案格式时出错:', e);
                }
              } else {
                console.error('找不到爬取内容:', { index, originalIndex, crawlResults });
                message.error('找不到爬取内容');
              }
            };
          } else {
            console.warn('API返回数据中没有outputList字段或为空');
            message.warning('未获取到爬虫数据，请重试');
          }
        } catch (error) {
          console.error('解析爬虫API响应失败:', error);
          console.error('原始数据:', result.data);
          message.error('解析响应失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未获取到爬虫数据，请重试');
      }
    } catch (error) {
      console.error('爬虫模式错误:', error);
      message.error('爬虫数据获取失败，请稍后重试');
    } finally {
      setCrawlLoading(false);
    }
  };

  // 新增函数：处理图片点击放大
  const handleImageClick = (imageUrl) => {
    setLightboxImage(imageUrl);
    setLightboxVisible(true);
  };

  // 关闭图片查看器
  const closeLightbox = () => {
    setLightboxVisible(false);
  };

  // 生成爬取文案HTML的函数，使用当前状态中的排序类型
  const generateCrawlResultsHTML = (data, schoolName) => {
    // 根据排序方式对数据进行排序
    let sortedData = [...data];
    
    if (crawlSortType === 'likes') {
      // 按点赞数排序（降序）
      sortedData.sort((a, b) => (b.like_number || 0) - (a.like_number || 0));
    } else if (crawlSortType === 'time') {
      // 按时间排序（降序，最新的在前）
      sortedData.sort((a, b) => {
        const dateA = a.upload_time ? new Date(a.upload_time) : new Date(0);
        const dateB = b.upload_time ? new Date(b.upload_time) : new Date(0);
        return dateB - dateA;
      });
    }
    
    // 保存排序后的数据索引映射，用于数据索引转换
    window.sortedIndexMap = sortedData.map(item => {
      // 找到原始数据中这个item的索引
      return data.findIndex(original => original === item);
    });
    
    // 定义图片点击函数
    window.openLightbox = (imageUrl) => {
      setLightboxImage(imageUrl);
      setLightboxVisible(true);
    };

    // 添加新的工作区图片函数
    window.addImageToWorkspace = (imageUrl) => {
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        if (!workspaceImages.includes(imageUrl)) {
          setWorkspaceImages(prev => [...prev, imageUrl]);
          message.success('已添加图片到工作区');
        } else {
          message.info('此图片已在工作区中');
        }
      }
    };
    
    // 添加所有图片到工作区函数
    window.copyAllImagesToWorkspace = (index) => {
      // 如果存在排序后的索引映射，使用它来获取正确的索引
      const originalIndex = window.sortedIndexMap ? window.sortedIndexMap[index] : index;
      
      // 如果爬取结果存在
      if (data && data[originalIndex] && data[originalIndex].image_list) {
        let imageUrls = data[originalIndex].image_list;
        console.log('尝试添加所有图片，原始数据:', imageUrls);
        
        // 如果image_list是字符串，尝试解析为数组
        if (typeof imageUrls === 'string') {
          try {
            imageUrls = JSON.parse(imageUrls);
            console.log('解析后的图片URL:', imageUrls);
          } catch (e) {
            console.error('解析图片列表失败:', e);
            imageUrls = [];
          }
        }
        
        // 确保imageUrls是数组
        if (!Array.isArray(imageUrls)) {
          console.warn('图片列表不是数组，尝试转换');
          // 尝试转换为数组
          if (imageUrls && typeof imageUrls === 'object') {
            // 如果是对象，尝试提取其值作为数组
            imageUrls = Object.values(imageUrls);
          } else if (imageUrls && typeof imageUrls === 'string') {
            // 如果是单个URL字符串
            imageUrls = [imageUrls];
          } else {
            imageUrls = [];
          }
        }
        
        // 过滤掉无效的URL
        imageUrls = imageUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');
        
        if (imageUrls.length > 0) {
          // 将所有图片添加到工作区
          setWorkspaceImages(prev => {
            // 过滤掉已存在的图片URL
            const newUrls = imageUrls.filter(url => !prev.includes(url));
            if (newUrls.length === 0) {
              message.info('所有图片已在工作区中');
              return prev;
            }
            message.success(`已添加 ${newUrls.length} 张图片到工作区`);
            return [...prev, ...newUrls];
          });
        } else {
          message.info('没有可用的图片');
        }
      } else {
        message.info('此内容没有图片');
      }
    };
    
    // 遍历排序后的数据生成卡片HTML
    const cardsHTML = sortedData.map((item, index) => {
      // 使用API返回的title字段
      const title = item.title || '无标题';
      
      // 格式化日期
      let dateDisplay = '';
      if (item.upload_time) {
        const dateMatch = item.upload_time.match(/\d{4}-\d{2}-\d{2}/);
        dateDisplay = dateMatch ? dateMatch[0] : item.upload_time;
      }
      
      // 处理图片列表
      let imagesHTML = '';
      if (item.image_list) {
        let imageUrls = item.image_list;
        
        // 如果image_list是字符串，尝试解析为数组
        if (typeof imageUrls === 'string') {
          try {
            imageUrls = JSON.parse(imageUrls);
          } catch (e) {
            console.error('解析图片列表失败:', e);
            imageUrls = [];
          }
        }
        
        // 确保imageUrls是数组
        if (!Array.isArray(imageUrls)) {
          // 尝试转换为数组
          if (imageUrls && typeof imageUrls === 'object') {
            // 如果是对象，尝试提取其值作为数组
            imageUrls = Object.values(imageUrls);
          } else if (imageUrls && typeof imageUrls === 'string') {
            // 如果是单个URL字符串
            imageUrls = [imageUrls];
          } else {
            imageUrls = [];
          }
        }
        
        // 过滤掉无效的URL
        imageUrls = imageUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');
        
        // 只有当图片列表非空时才显示图片区域
        if (imageUrls.length > 0) {
          imagesHTML = `
<div style="margin-top: 15px; margin-bottom: 15px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <div style="font-weight: bold;">图片列表:</div>
    <button 
      onclick="window.copyAllImagesToWorkspace(${index})" 
      style="background-color: #1890ff; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;"
      data-index="${index}"
    >
      添加全部图片到工作区
    </button>
  </div>
  <div style="display: flex; flex-wrap: wrap; gap: 10px;">
    ${imageUrls.map((url, imgIndex) => `
      <div style="position: relative; width: 200px; height: 200px; overflow: hidden; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;">
        <img 
          src="${url}" 
          alt="小红书图片" 
          style="width: 100%; height: 100%; object-fit: cover;" 
          onclick="window.openLightbox('${url}')" 
          onerror="this.src='https://via.placeholder.com/200x200?text=加载失败'; this.onerror=null;"
        />
        <button 
          onclick="window.addImageToWorkspace('${url}')" 
          style="position: absolute; top: 5px; right: 5px; background-color: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer;"
          title="添加到工作区"
        >
          +
        </button>
      </div>
    `).join('')}
  </div>
</div>`;
        }
      }
      
      // 创建卡片式HTML，使用data-index属性存储索引，方便在copyToWorkspace中获取
      return `
<div style="margin-bottom: 20px; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; background-color: #f9f9f9;">
  <div style="display: flex; align-items: center; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; margin-bottom: 15px;">
    <button 
      onclick="window.copyToWorkspace(${index})" 
      style="margin-right: 10px; background-color: #722ED1; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; display: flex; align-items: center;"
      data-index="${index}"
    >
      <span style="display: inline-block; margin-right: 5px;">📝</span>
      工作区
    </button>
    <h3 style="margin: 0; color: #333;">${title}</h3>
  </div>
  
  <div style="white-space: pre-wrap; margin-bottom: 15px;">${item.content}</div>
  
  ${imagesHTML}
  
  <div style="color: #666; margin-bottom: 10px;">
    ${item.note_url ? `<div><strong>原文链接</strong>: <a href="${item.note_url}" target="_blank">点击查看原文</a></div>` : ''}
    ${dateDisplay ? `<div><strong>发布时间</strong>: ${dateDisplay}</div>` : ''}
  </div>
  
  <div style="display: flex; gap: 15px; font-size: 0.9em; color: #666;">
    <span>👍 ${item.like_number || 0}</span>
    <span>⭐ ${item.favorite_number || 0}</span>
    <span>💬 ${item.comment_number || 0}</span>
  </div>
</div>
`;
    }).join('\n');
    
    // 返回完整的HTML
    return cardsHTML;
  };
  
  // 新增函数：生成爬取文案HTML，接收排序类型作为参数
  const generateCrawlResultsHTMLWithSort = (data, schoolName, sortType) => {
    // 根据排序方式对数据进行排序
    let sortedData = [...data];
    
    if (sortType === 'likes') {
      // 按点赞数排序（降序）
      sortedData.sort((a, b) => (b.like_number || 0) - (a.like_number || 0));
    } else if (sortType === 'time') {
      // 按时间排序（降序，最新的在前）
      sortedData.sort((a, b) => {
        const dateA = a.upload_time ? new Date(a.upload_time) : new Date(0);
        const dateB = b.upload_time ? new Date(b.upload_time) : new Date(0);
        return dateB - dateA;
      });
    }
    
    // 保存排序后的数据索引映射，用于数据索引转换
    window.sortedIndexMap = sortedData.map(item => {
      // 找到原始数据中这个item的索引
      return data.findIndex(original => original === item);
    });
    
    // 定义图片点击函数
    window.openLightbox = (imageUrl) => {
      setLightboxImage(imageUrl);
      setLightboxVisible(true);
    };
    
    // 添加新的工作区图片函数
    window.addImageToWorkspace = (imageUrl) => {
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        if (!workspaceImages.includes(imageUrl)) {
          setWorkspaceImages(prev => [...prev, imageUrl]);
          message.success('已添加图片到工作区');
        } else {
          message.info('此图片已在工作区中');
        }
      }
    };
    
    // 添加所有图片到工作区函数
    window.copyAllImagesToWorkspace = (index) => {
      // 如果存在排序后的索引映射，使用它来获取正确的索引
      const originalIndex = window.sortedIndexMap ? window.sortedIndexMap[index] : index;
      
      // 如果爬取结果存在
      if (data && data[originalIndex] && data[originalIndex].image_list) {
        let imageUrls = data[originalIndex].image_list;
        console.log('尝试添加所有图片，原始数据:', imageUrls);
        
        // 如果image_list是字符串，尝试解析为数组
        if (typeof imageUrls === 'string') {
          try {
            imageUrls = JSON.parse(imageUrls);
            console.log('解析后的图片URL:', imageUrls);
          } catch (e) {
            console.error('解析图片列表失败:', e);
            imageUrls = [];
          }
        }
        
        // 确保imageUrls是数组
        if (!Array.isArray(imageUrls)) {
          console.warn('图片列表不是数组，尝试转换');
          // 尝试转换为数组
          if (imageUrls && typeof imageUrls === 'object') {
            // 如果是对象，尝试提取其值作为数组
            imageUrls = Object.values(imageUrls);
          } else if (imageUrls && typeof imageUrls === 'string') {
            // 如果是单个URL字符串
            imageUrls = [imageUrls];
          } else {
            imageUrls = [];
          }
        }
        
        // 过滤掉无效的URL
        imageUrls = imageUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');
        
        if (imageUrls.length > 0) {
          // 将所有图片添加到工作区
          setWorkspaceImages(prev => {
            // 过滤掉已存在的图片URL
            const newUrls = imageUrls.filter(url => !prev.includes(url));
            if (newUrls.length === 0) {
              message.info('所有图片已在工作区中');
              return prev;
            }
            message.success(`已添加 ${newUrls.length} 张图片到工作区`);
            return [...prev, ...newUrls];
          });
        } else {
          message.info('没有可用的图片');
        }
      } else {
        message.info('此内容没有图片');
      }
    };
    
    // 遍历排序后的数据生成卡片HTML
    const cardsHTML = sortedData.map((item, index) => {
      // 使用API返回的title字段
      const title = item.title || '无标题';
      
      // 格式化日期
      let dateDisplay = '';
      if (item.upload_time) {
        const dateMatch = item.upload_time.match(/\d{4}-\d{2}-\d{2}/);
        dateDisplay = dateMatch ? dateMatch[0] : item.upload_time;
      }
      
      // 处理图片列表
      let imagesHTML = '';
      if (item.image_list) {
        let imageUrls = item.image_list;
        
        // 如果image_list是字符串，尝试解析为数组
        if (typeof imageUrls === 'string') {
          try {
            imageUrls = JSON.parse(imageUrls);
          } catch (e) {
            console.error('解析图片列表失败:', e);
            imageUrls = [];
          }
        }
        
        // 只有当图片列表非空时才显示图片区域
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
          imagesHTML = `
<div style="margin-top: 15px; margin-bottom: 15px;">
  <div style="font-weight: bold; margin-bottom: 10px;">图片列表:</div>
  <div style="display: flex; flex-wrap: wrap; gap: 10px;">
    ${imageUrls.map((url, imgIndex) => `
      <div style="width: 200px; height: 200px; overflow: hidden; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.openLightbox('${url}')">
        <img src="${url}" alt="小红书图片" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/200x200?text=加载失败'; this.onerror=null;" />
      </div>
    `).join('')}
  </div>
</div>`;
        }
      }
      
      // 创建卡片式HTML，使用data-index属性存储索引，方便在copyToWorkspace中获取
      return `
<div style="margin-bottom: 20px; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px; background-color: #f9f9f9;">
  <div style="display: flex; align-items: center; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; margin-bottom: 15px;">
    <button 
      onclick="window.copyToWorkspace(${index})" 
      style="margin-right: 10px; background-color: #722ED1; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; display: flex; align-items: center;"
      data-index="${index}"
    >
      <span style="display: inline-block; margin-right: 5px;">📝</span>
      工作区
    </button>
    <h3 style="margin: 0; color: #333;">${title}</h3>
  </div>
  
  <div style="white-space: pre-wrap; margin-bottom: 15px;">${item.content}</div>
  
  ${imagesHTML}
  
  <div style="color: #666; margin-bottom: 10px;">
    ${item.note_url ? `<div><strong>原文链接</strong>: <a href="${item.note_url}" target="_blank">点击查看原文</a></div>` : ''}
    ${dateDisplay ? `<div><strong>发布时间</strong>: ${dateDisplay}</div>` : ''}
  </div>
  
  <div style="display: flex; gap: 15px; font-size: 0.9em; color: #666;">
    <span>👍 ${item.like_number || 0}</span>
    <span>⭐ ${item.favorite_number || 0}</span>
    <span>💬 ${item.comment_number || 0}</span>
  </div>
</div>
`; 
    }).join('\n');
    
    // 返回完整的HTML
    return cardsHTML;
  };

  const handleCopy = (text) => {
    // 复制时去除HTML标签
    const plainText = text.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(plainText);
    message.success('复制成功');
  };

  const handleCopyAll = () => {
    // 复制时去除HTML标签
    const allText = contents
      .map(text => text.replace(/<[^>]+>/g, ''))
      .join('\n\n');
    navigator.clipboard.writeText(allText);
    message.success('已复制所有文案！');
  };

  // 清除全部文案
  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除所有生成的文案吗？',
      onOk: () => {
        setContents([]);
        message.success('已清除所有文案');
      }
    });
  };

  const showApiInfo = () => {
    setIsModalVisible(true);
  };

  // 处理编辑按钮点击
  const handleEdit = (index, content) => {
    setEditingIndex(index);
    setEditingContent(content.replace(/<[^>]+>/g, '')); // 去除HTML标签
  };

  // 处理保存编辑
  const handleSaveEdit = (index) => {
    const newContents = [...contents];
    newContents[index] = editingContent;
    setContents(newContents);
    setEditingIndex(null);
    setEditingContent('');
    message.success('文案修改成功');
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingContent('');
  };
  
  // 显示历史记录
  const showHistory = () => {
    setIsHistoryModalVisible(true);
  };

  // 恢复历史记录
  const restoreHistory = (historyItem) => {
    setSchool(historyItem.school);
    if (styleOptions.some(option => option.value === historyItem.style)) {
      setStyle(historyItem.style);
      setCustomStyle('');
    } else {
      setStyle('custom_prompt');
      setCustomStyle(historyItem.style);
    }
    setContents(historyItem.contents);
    setApiInfo(prev => ({
      ...prev,
      report: historyItem.report
    }));
    setIsHistoryModalVisible(false);
    message.success('已恢复历史记录');
  };

  // 删除历史记录
  const deleteHistory = (id) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    message.success('已删除该条历史记录');
  };

  // 清空历史记录
  const clearHistory = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复',
      onOk: () => {
        setHistory([]);
        localStorage.removeItem('contentHistory');
        message.success('已清空所有历史记录');
      }
    });
  };

  // 处理推送到小程序按钮点击
  const handlePush = (content) => {
    // 获取内容并分割行
    const contentLines = content.split('\n');
    // 第一行作为生成标题的参考，但不包含在正文中
    const firstLine = contentLines[0].trim();
    // 正文内容（从第二行开始）
    const bodyContent = contentLines.slice(1).join('\n').trim();
    
    // 去除表情符号和特殊字符生成标题
    const cleanTitle = firstLine.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\w\s\u4e00-\u9fa5]/g, '').trim();
    
    // 查找与该内容相关的图片URL
    let imageUrls = [];
    
    // 同时准备可用的图片列表，用于图片选择器
    let allAvailableImages = [];
    let directlyRelatedImages = []; // 用于存储与当前文案直接相关的图片
    
    // 1. 从爬虫结果中收集所有图片
    if (crawlResults && crawlResults.length > 0) {
      crawlResults.forEach(item => {
        if (item.image_list) {
          let images = [];
          if (typeof item.image_list === 'string') {
            try {
              images = JSON.parse(item.image_list);
            } catch (e) {
              console.error('解析图片列表失败:', e);
            }
          } else if (Array.isArray(item.image_list)) {
            images = item.image_list;
          }
          
          // 检查图片是否与当前文案直接相关
          // 如果标题为空或"未知标题"，则不视为相关
          const hasValidTitle = item.title && item.title.trim() !== '' && item.title !== '未知标题';
          const isDirectlyRelated = hasValidTitle && (
            content.includes(item.content) || 
            item.content.includes(content) ||
            content.includes(item.title) || 
            item.title.includes(firstLine)
          );
          
          // 添加图片到可用列表，并标记来源
          images.forEach(url => {
            if (url) {
              // 创建图片对象
              const imageObj = {
                url: url,
                source: `${item.title || '未知标题'} (爬取结果)`,
                isRelated: isDirectlyRelated
              };
              
              // 避免重复添加
              if (!allAvailableImages.some(img => img.url === url)) {
                allAvailableImages.push(imageObj);
                
                // 如果是直接相关的图片，也添加到相关图片列表
                if (isDirectlyRelated) {
                  directlyRelatedImages.push(imageObj);
                  
                  // 如果是直接相关的图片，也添加到默认图片URL中
                  if (!imageUrls.includes(url)) {
                    imageUrls.push(url);
                  }
                }
              }
            }
          });
        }
      });
    }
    
    // 2. 从历史记录中收集图片
    if (history.length > 0) {
      history.forEach(historyItem => {
        if (historyItem.originalData && Array.isArray(historyItem.originalData)) {
          historyItem.originalData.forEach(data => {
            if (data.image_list) {
              let images = [];
              if (typeof data.image_list === 'string') {
                try {
                  images = JSON.parse(data.image_list);
                } catch (e) {
                  console.error('解析历史图片列表失败:', e);
                }
              } else if (Array.isArray(data.image_list)) {
                images = data.image_list;
              }
              
              // 检查图片是否与当前文案直接相关
              // 如果标题为空或"未知标题"，则不视为相关
              const hasValidTitle = data.title && data.title.trim() !== '' && data.title !== '未知标题';
              const isRelatedToCurrentContent = hasValidTitle && (
                content.includes(data.content) || 
                data.content.includes(content) ||
                content.includes(data.title) || 
                data.title.includes(firstLine)
              );
              
              // 添加图片到可用列表，并标记来源
              images.forEach(url => {
                if (url) {
                  // 创建图片对象
                  const imageObj = {
                    url: url,
                    source: `${data.title || '未知标题'} (历史记录)`,
                    isRelated: isRelatedToCurrentContent
                  };
                  
                  // 避免重复添加
                  if (!allAvailableImages.some(img => img.url === url)) {
                    allAvailableImages.push(imageObj);
                    
                    // 如果是直接相关的图片，也添加到相关图片列表
                    if (isRelatedToCurrentContent) {
                      directlyRelatedImages.push(imageObj);
                      
                      // 如果是直接相关的图片，也添加到默认图片URL中
                      if (!imageUrls.includes(url)) {
                        imageUrls.push(url);
                      }
                    }
                  }
                }
              });
            }
          });
        }
      });
    }
    
    // 3. 添加一些预设的示例图片（如果需要）
    const presetImages = [
      "https://media.nfnews.com/nfplus/ossfs/pic/xy/202404/23/a9942aac4f154d809690cd5c7364ecb9_batchwm.jpg",
      "https://media.nfnews.com/nfplus/ossfs/pic/xy/202404/25/1831cf1af0d04c78a7a92af6cea8e399_batchwm.jpg",
      "https://media.nfnews.com/nfplus/ossfs/pic/xy/202404/24/e2a3c8fd651d4b6cabe1a8da1a6c4c8d_batchwm.jpg"
    ];
    
    presetImages.forEach((url, index) => {
      if (!allAvailableImages.some(img => img.url === url)) {
        allAvailableImages.push({
          url: url,
          source: '推荐图片',
          isRelated: false
        });
      }
    });
    
    // 4. 对图片列表进行排序，相关的图片排在前面
    const sortedImages = [
      ...directlyRelatedImages, // 直接相关的图片放在最前面
      ...allAvailableImages.filter(img => !img.isRelated) // 不相关的图片放在后面
    ];
    
    // 设置可用图片列表为排序后的列表
    setAvailableImages(sortedImages);
    
    setCurrentPushContent(content);
    pushForm.setFieldsValue({
      title: cleanTitle || "小红书文案",
      body: bodyContent, // 使用除第一行外的内容作为正文
      images_list: imageUrls, // 设置找到的图片URL列表
      school_id: 60, // 默认学校ID
      tag_id: 13, // 默认标签ID
    });
    setIsPushModalVisible(true);
  };

  // 验证API是否可用
  const validateApi = async () => {
    message.loading('正在验证API...');
    
    // 定义可能的API地址列表
    const apiUrls = [
      '/api/zc/pubs/grad_create/',
      '/api/zc/pubs/',
      'http://gxxsh.yonp.top/api/zc/pubs/grad_create/',
      'https://gxxsh.yonp.top/api/zc/pubs/grad_create/'
    ];
    
    let successful = false;
    
    for (const apiUrl of apiUrls) {
      try {
        message.info(`正在尝试连接: ${apiUrl}`);
        
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch(apiUrl, {
          method: 'OPTIONS',
          mode: 'cors',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId); // 清除超时定时器
        
        console.log(`API ${apiUrl} 验证状态:`, response.status);
        
        if (response.ok) {
          message.success(`API可以连接: ${apiUrl}`);
          successful = true;
          
          // 记住成功的API地址
          localStorage.setItem('successfulApiUrl', apiUrl);
          
          Modal.info({
            title: 'API状态',
            content: (
              <div>
                <p>API连接成功: {apiUrl}</p>
                <p>状态码: {response.status}</p>
                <p>这表示API服务器可以访问，但不代表推送一定会成功。</p>
                <p>推送可能还需要正确的数据格式和授权信息。</p>
                <p>建议:</p>
                <ul>
                  <li>检查网络连接</li>
                  <li>联系API提供者确认正确的地址</li>
                  <li>尝试使用代理服务器转发请求</li>
                  <li>
                    在package.json中添加代理配置：
                    <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      "proxy": "http://gxxsh.yonp.top"
                    </pre>
                  </li>
                </ul>
              </div>
            )
          });
          break;
        }
      } catch (error) {
        console.error(`API ${apiUrl} 验证错误:`, error);
      }
    }
    
    if (!successful) {
      message.error(`所有API地址连接失败`);
      Modal.error({
        title: 'API不可用',
        content: (
          <div>
            <p>错误: Failed to fetch - 无法连接到任何API地址</p>
            <p>可能的原因:</p>
            <ul>
              <li>API服务器可能暂时不可用</li>
              <li>API地址可能已更改</li>
              <li>网络连接问题</li>
              <li>浏览器的跨域(CORS)限制</li>
              <li>防火墙或安全软件阻止了连接</li>
            </ul>
            <p>建议:</p>
            <ul>
              <li>检查网络连接</li>
              <li>联系API提供者确认正确的地址</li>
              <li>尝试使用代理服务器转发请求</li>
            </ul>
          </div>
        )
      });
    }
  };

  // 处理推送提交
  const handlePushSubmit = async () => {
    try {
      setPushLoading(true);
      const values = await pushForm.validateFields();

      // 构建符合 Coze API 要求的数据结构
      const cozeRequestData = {
        parameters: {
          title: values.title,
          body: values.body,
          // 如果 Coze workflow 需要其他参数，可以在这里添加
          // images_list: Array.isArray(values.images_list) ? values.images_list : [],
          // school_id: parseInt(values.school_id),
          // tag_id: parseInt(values.tag_id)
        },
        workflow_id: "7498187555692920884"
      };

      console.log('推送 Coze API 数据:', JSON.stringify(cozeRequestData));

      // 使用新的 Coze API 地址
      const apiUrl = 'https://api.coze.cn/v1/workflow/run';
      console.log('使用 Coze API 地址:', apiUrl);

      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

      try {
        // 发送 Coze API 推送请求
        const response = await fetch(apiUrl, {
          method: 'POST',
          signal: controller.signal, // 添加超时控制
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 添加 Coze API 的 Authorization 头
            'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY'
          },
          body: JSON.stringify(cozeRequestData)
        });

        clearTimeout(timeoutId); // 清除超时定时器

        console.log('Coze API 推送响应状态:', response.status);
        const result = await response.json();
        console.log('Coze API 推送响应内容:', result);

        // 处理 Coze API 的响应 (通常 code === 0 表示成功)
        if (result.code === 0) {
          message.success('推送成功 (Coze API)');
          setIsPushModalVisible(false);

          // 显示成功信息 (可以根据 Coze API 返回的具体 data 定制)
          Modal.info({
            title: '推送成功',
            content: (
              <div>
                <p>文案已成功通过 Coze API 推送。</p>
                {result.data && <p>API 返回信息: {JSON.stringify(result.data)}</p>}
                <p>请检查目标系统确认是否已接收。</p>
              </div>
            ),
          });
          
          // 保留工作区内容，特别是图片列表
          // 不清空workspaceImages，允许用户继续处理这些图片
        } else {
          const errorMessage = result.msg || result.message || `Coze API 错误 (code: ${result.code})`;
          message.error(`推送失败: ${errorMessage}`);

          // 显示详细错误信息
          Modal.error({
            title: '推送失败 (Coze API)',
            content: (
              <div>
                <p>错误信息: {errorMessage}</p>
                <p>状态码: {response.status}</p>
                <p>API Code: {result.code}</p>
                <p>请检查请求参数和网络连接。</p>
              </div>
            ),
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // 清除超时定时器

        if (fetchError.name === 'AbortError') {
          message.error('请求超时，Coze API 服务器没有响应');
          Modal.error({
            title: '请求超时',
            content: <p>Coze API 服务器在规定时间内没有响应 (15秒)。请检查网络或稍后再试。</p>
          });
        } else {
          // 处理其他网络或解析错误
          message.error(`推送失败: ${fetchError.message || '网络错误或无法连接服务器'}`);
          Modal.error({
            title: '推送失败',
            content: <p>无法连接到 Coze API 服务器或发生其他错误: {fetchError.message}</p>
          });
        }
        console.error('Coze API Fetch Error:', fetchError);
      }
    } catch (error) {
      console.error('表单验证错误:', error);
      message.error('表单验证失败，请检查输入');
    } finally {
      setPushLoading(false);
    }
  };

  // 获取过滤后的历史记录
  const getFilteredHistory = () => {
    return history.filter(item => {
      const schoolMatch = !historyFilter.school || item.school.includes(historyFilter.school);
      const styleMatch = !historyFilter.style || item.style.includes(historyFilter.style);
      return schoolMatch && styleMatch;
    });
  };

  // 处理AI修改按钮点击
  const handleAiModify = async (content) => {
    setAiModifyOriginalContent(content);
    setEditingAiModifyOriginal(content); // 设置可编辑的内容
    setAiModifyResult(''); // 初始化优化结果为空
    setAiLoading(false); // 不显示加载状态
    setAiPrompt(''); // 设置默认提示词为空
    
    // 打开弹窗
    setIsAiModifyModalVisible(true);
  };
  
  // 修改确认修改的函数
  const confirmAiModify = async () => {
    // 开始加载
    setAiLoading(true);
    
    try {
      console.log('开始调用AI修改API...');
      console.log('请求参数:', {
        parameters: {
          tiezi: editingAiModifyOriginal,
          prompt: aiPrompt
        },
        workflow_id: '7499034843725135923'
      });
      
      // 调用 Coze API
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            tiezi: editingAiModifyOriginal,
            prompt: aiPrompt
          },
          workflow_id: '7499034843725135923'
        })
      });

      console.log('AI修改API响应状态:', response.status);
      const result = await response.json();
      console.log('AI修改API响应数据:', result);
      
      // 处理 API 响应
      if (result.code === 0 && result.data) {
        try {
          // 检查result.data是否为字符串，如果是则解析JSON
          let parsedData;
          if (typeof result.data === 'string') {
            parsedData = JSON.parse(result.data);
            console.log('解析后的JSON数据:', parsedData);
          } else {
            parsedData = result.data;
          }
          
          // 直接使用解析后的数据中的output字段
          if (parsedData && parsedData.output) {
            setAiModifyResult(parsedData.output);
            message.success('已获取优化结果，请点击"应用并关闭"来应用修改');
          } else {
            console.warn('API返回数据中没有output字段:', parsedData);
            message.warning('未能获取到修改结果，请重试');
          }
        } catch (error) {
          console.error('解析API返回数据失败:', error, result.data);
          message.error('解析API返回数据失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未能获取到修改结果，请重试');
      }
    } catch (error) {
      console.error('API调用错误:', error);
      message.error('修改失败，请稍后重试');
      // 如果API调用失败，显示简单的修改
      setAiModifyResult(`✨ ${editingAiModifyOriginal.replace(/^🏫|^🎓/, '')}`);
    } finally {
      setAiLoading(false);
    }
  };
  
  // 添加一个新函数用于应用修改并关闭弹窗
  const applyAndCloseModal = () => {
    // 找到当前内容在数组中的索引
    const index = contents.findIndex(item => item === aiModifyOriginalContent);
    if (index !== -1 && aiModifyResult) {
      // 更新内容
      const newContents = [...contents];
      newContents[index] = aiModifyResult;
      setContents(newContents);
      message.success('文案已应用并关闭！');
    } else if (aiModifyResult) {
      // 如果不是来自内容列表，可能是来自工作区
      if (aiModifyOriginalContent === originalText) {
        applyAiResultToWorkspace();
      }
    }
    
    // 关闭弹窗
    setIsAiModifyModalVisible(false);
  };

  // 添加复制AI优化结果的函数
  const copyAiResult = () => {
    navigator.clipboard.writeText(aiModifyResult);
    message.success('已复制优化结果');
  };

  // 添加图片到表单的函数
  const handleAddImage = (imageUrl) => {
    // 获取当前表单中的图片列表
    const currentImages = pushForm.getFieldValue('images_list') || [];
    // 确保不重复添加相同URL
    if (!currentImages.includes(imageUrl)) {
      // 添加新图片URL到列表
      pushForm.setFieldsValue({
        images_list: [...currentImages, imageUrl]
      });
      
      // 同时添加到工作区图片列表
      if (!workspaceImages.includes(imageUrl)) {
        handleAddWorkspaceImage(imageUrl);
      }
    }
    // 关闭图片选择器
    setIsImageSelectorVisible(false);
  };

  // 工作区相关函数
  const handleOriginalTextChange = (e) => {
    setOriginalText(e.target.value);
  };

  const handlePromptTextChange = (e) => {
    setPromptText(e.target.value);
  };

  const handleTitleTextChange = (e) => {
    setTitleText(e.target.value);
  };

  const handleContentTextChange = (e) => {
    setContentText(e.target.value);
  };

  const handleWorkspaceAiModify = async () => {
    if (!originalText.trim()) {
      message.warning('请先输入原文内容');
      return;
    }

    // 使用提示词作为AI指令，如果没有则使用默认提示词
    let prompt = promptText.trim();
    if (!prompt) {
      prompt = '请改写以下文案，使其更加吸引人，符合小红书平台风格';
    }
    
    // 显示加载中提示
    message.loading('AI正在改写文案...', 0);
    
    try {
      console.log('开始调用AI修改API...');
      console.log('请求参数:', {
        parameters: {
          tiezi: originalText,
          prompt: prompt
        },
        workflow_id: '7499034843725135923'
      });
      
      // 直接调用 Coze API
      const response = await fetch('https://api.coze.cn/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            tiezi: originalText,
            prompt: prompt
          },
          workflow_id: '7499034843725135923'
        })
      });

      // 关闭加载提示
      message.destroy();
      
      console.log('AI修改API响应状态:', response.status);
      const result = await response.json();
      console.log('AI修改API响应数据:', result);
      
      // 处理 API 响应
      if (result.code === 0 && result.data) {
        try {
          // 检查result.data是否为字符串，如果是则解析JSON
          let parsedData;
          if (typeof result.data === 'string') {
            parsedData = JSON.parse(result.data);
            console.log('解析后的JSON数据:', parsedData);
          } else {
            parsedData = result.data;
          }
          
          // 直接使用解析后的数据中的output字段
          if (parsedData && parsedData.output) {
            // 将结果直接设置到生成结果文本框
            setGeneratedText(parsedData.output);
            message.success('AI改写完成');
          } else {
            console.warn('API返回数据中没有output字段:', parsedData);
            message.warning('未能获取到改写结果，请重试');
          }
        } catch (error) {
          console.error('解析API返回数据失败:', error, result.data);
          message.error('解析API返回数据失败，请重试');
        }
      } else {
        console.warn('API调用失败:', result);
        message.warning('未能获取到改写结果，请重试');
      }
    } catch (error) {
      // 关闭加载提示
      message.destroy();
      
      console.error('API调用错误:', error);
      message.error('修改失败，请稍后重试');
    }
  };

  const handleWorkspacePush = async () => {
    // 如果标题或内容为空，显示提示
    if (!titleText.trim()) {
      message.warning('标题不能为空，请输入标题');
      return;
    }
    if (!contentText.trim()) {
      message.warning('内容不能为空，请输入内容');
      return;
    }
    
    // 清理标题（移除表情符号和特殊字符）
    const cleanTitle = titleText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\w\s\u4e00-\u9fa5]/g, '').trim();
    
    try {
      // 显示加载中状态
      message.loading('正在推送...', 0);
      setPushLoading(true);
      
      // 构建符合 Coze API 要求的数据结构
      const cozeRequestData = {
        parameters: {
          title: cleanTitle || "小红书文案",
          body: contentText,
          images_list: workspaceImages, // 使用工作区图片列表
          school_id: 60, // 默认学校ID
          tag_id: 13 // 默认标签ID
        },
        workflow_id: "7498187555692920884"
      };

      console.log('推送 Coze API 数据:', JSON.stringify(cozeRequestData));

      // API地址
      const apiUrl = 'https://api.coze.cn/v1/workflow/run';
      console.log('使用 Coze API 地址:', apiUrl);

      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

      // 发送 Coze API 推送请求
      const response = await fetch(apiUrl, {
        method: 'POST',
        signal: controller.signal, // 添加超时控制
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // 添加 Coze API 的 Authorization 头
          'Authorization': 'Bearer pat_wBxRH66eSNFjZPp5A9WNMIJg5Ux8JJffhgjkArPPpj2DDdemVvQuVDQbIs47HaGY'
        },
        body: JSON.stringify(cozeRequestData)
      });

      clearTimeout(timeoutId); // 清除超时定时器
      // 关闭加载提示
      message.destroy();

      console.log('Coze API 推送响应状态:', response.status);
      const result = await response.json();
      console.log('Coze API 推送响应内容:', result);

      // 处理 Coze API 的响应
      if (result.code === 0) {
        message.success('推送成功');

        // 显示成功信息
        Modal.info({
          title: '推送成功',
          content: (
            <div>
              <p>文案已成功通过 Coze API 推送。</p>
              {result.data && <p>API 返回信息: {JSON.stringify(result.data)}</p>}
              <p>请检查目标系统确认是否已接收。</p>
            </div>
          ),
        });
      } else {
        const errorMessage = result.msg || result.message || `Coze API 错误 (code: ${result.code})`;
        message.error(`推送失败: ${errorMessage}`);

        // 显示详细错误信息
        Modal.error({
          title: '推送失败',
          content: (
            <div>
              <p>错误信息: {errorMessage}</p>
              <p>状态码: {response.status}</p>
              <p>API Code: {result.code}</p>
              <p>请检查请求参数和网络连接。</p>
            </div>
          ),
        });
      }
    } catch (error) {
      // 关闭加载提示
      message.destroy();
      
      console.error('推送错误:', error);
      
      if (error.name === 'AbortError') {
        message.error('请求超时，API服务器没有响应');
      } else {
        message.error(`推送失败: ${error.message || '网络错误'}`);
      }
    } finally {
      setPushLoading(false);
    }
  };

  const clearWorkspace = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空工作区所有内容吗？',
      onOk: () => {
        setOriginalText('');
        setPromptText('');
        setGeneratedText('');  // 清除生成结果
        setTitleText('');
        setContentText('');
        setWorkspaceImages([]); // 清空图片列表
        message.success('工作区已清空');
      }
    });
  };

  const applyAiResultToWorkspace = () => {
    if (aiModifyResult) {
      // 尝试提取标题和内容
      try {
        // 尝试检测是否有"【标题】"或类似标记
        const titleMatch = aiModifyResult.match(/(?:【|#|「|『|\[)?\s*(?:标题|title)\s*(?:】|#|」|』|\])?\s*[：:]\s*(.*?)(?:\n|$)/i);
        const contentMatch = aiModifyResult.match(/(?:【|#|「|『|\[)?\s*(?:内容|正文|content)\s*(?:】|#|」|』|\])?\s*[：:]\s*([\s\S]*)/i);
        
        // 设置生成结果
        setGeneratedText(aiModifyResult);
        
        // 如果找到标题，则设置标题
        if (titleMatch && titleMatch[1]) {
          setTitleText(titleMatch[1].trim());
        }
        
        // 如果找到内容，则设置内容
        if (contentMatch && contentMatch[1]) {
          setContentText(contentMatch[1].trim());
        } else if (!contentMatch) {
          // 如果没有明确的内容标记，但有标题标记，则剩余部分作为内容
          if (titleMatch) {
            const remainingContent = aiModifyResult.replace(titleMatch[0], '').trim();
            if (remainingContent) {
              setContentText(remainingContent);
            }
          } else {
            // 如果既没有标题也没有内容标记，则整个文本作为内容
            setContentText(aiModifyResult);
          }
        }
        
        message.success('已应用到工作区');
      } catch (error) {
        console.error('解析AI结果出错:', error);
        // 如果解析失败，直接设置为内容
        setGeneratedText(aiModifyResult);
        setContentText(aiModifyResult);
        message.success('已应用到工作区 (没有检测到标题)');
      }
    } else {
      message.warning('没有可应用的AI生成结果');
    }
  };

  // 设置爬取内容到工作区
  const setToWorkspace = (title, content) => {
    // 将标题和内容合并设置到原文文本框
    const combinedText = title ? `${title}\n\n${content}` : content;
    setOriginalText(combinedText);
    // 清空标题文本框
    setTitleText('');
    message.success('已设置到工作区');
  };

  // 处理生成结果文本变化
  const handleGeneratedTextChange = (e) => {
    setGeneratedText(e.target.value);
  };

  // 添加工作区图片
  const handleAddWorkspaceImage = (imageUrl) => {
    setWorkspaceImages(prevImages => [...prevImages, imageUrl]);
  };

  // 移除工作区图片
  const handleRemoveWorkspaceImage = (index) => {
    setWorkspaceImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // 在组件加载时从sessionStorage恢复爬取结果
  useEffect(() => {
    try {
      const savedCrawlResults = sessionStorage.getItem('crawlResults');
      const savedCrawledContents = sessionStorage.getItem('crawledContents');
      
      if (savedCrawlResults) {
        setCrawlResults(JSON.parse(savedCrawlResults));
        console.log('已从sessionStorage恢复爬取结果');
      }
      
      if (savedCrawledContents) {
        window.crawledContents = JSON.parse(savedCrawledContents);
        console.log('已从sessionStorage恢复爬取内容');
      }
    } catch (e) {
      console.error('恢复爬取结果失败:', e);
    }
  }, []);
  
  // 当crawlResults发生变化时保存到sessionStorage
  useEffect(() => {
    if (crawlResults && crawlResults.length > 0) {
      try {
        sessionStorage.setItem('crawlResults', JSON.stringify(crawlResults));
        console.log('已保存爬取结果到sessionStorage');
      } catch (e) {
        console.error('保存爬取结果失败:', e);
      }
    }
  }, [crawlResults]);

  return (
    <Layout className="layout">
      <Header className="header">
        <div className="header-content">
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            小红书文案生成器
          </Title>
          <div className="header-icons">
            <Tooltip title="历史记录">
              <HistoryOutlined 
                className="header-icon" 
                onClick={showHistory}
                style={{ cursor: 'pointer' }}
              />
            </Tooltip>
            <Tooltip title="查看API调用信息">
              <InfoCircleOutlined 
                className="header-icon" 
                onClick={showApiInfo}
                style={{ cursor: 'pointer' }}
              />
            </Tooltip>
            <Tooltip title="快速生成">
              <ThunderboltOutlined className="header-icon" />
            </Tooltip>
            <Tooltip title="收藏">
              <StarOutlined className="header-icon" />
            </Tooltip>
            <Tooltip title="喜欢">
              <HeartOutlined className="header-icon" />
            </Tooltip>
          </div>
        </div>
      </Header>
      <Content className="content">
        <div className="main-container">
          <div className="input-section">
            <Space>
              <Select
                showSearch
                size="large"
                placeholder="请选择或输入学校名"
                value={school}
                onChange={handleSchoolChange}
                style={{ width: '300px' }}
                className="glow-input"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                allowClear
              >
                {schoolOptions.map(school => (
                  <Option key={school} value={school}>{school}</Option>
                ))}
              </Select>
            </Space>
            <div>
              <Button
                type="primary"
                size="large"
                onClick={handleCrawl}
                loading={crawlLoading}
                className="glow-button"
                style={{ 
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                爬虫模式
              </Button>
            </div>
          </div>
          
          <div className="content-display">
            <div className="left-section">
              <Card className="workspace-card">
                <div className="content-header" style={{ display: 'flex', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>工作区</Title>
                  <Space>
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={clearWorkspace}
                    >
                      清空
                    </Button>
                  </Space>
                </div>
                <Divider />
                <div className="workspace-section">
                  <div className="workspace-section-title">原文:</div>
                  <Input.TextArea
                    className="workspace-textarea workspace-textarea-original"
                    value={originalText}
                    onChange={handleOriginalTextChange}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="请输入或粘贴原始文案内容"
                  />
                </div>
                <div className="workspace-section">
                  <div className="workspace-section-title">提示词:</div>
                  <Input.TextArea
                    className="workspace-textarea workspace-textarea-prompt"
                    value={promptText}
                    onChange={handlePromptTextChange}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder="输入提示词引导AI创作（例如：'简短生动'、'增加情感'等）"
                  />
                </div>
                <div className="workspace-section">
                  <div className="workspace-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>生成结果:</span>
                    <div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<RobotOutlined />}
                        onClick={handleWorkspaceAiModify}
                        style={{ backgroundColor: '#722ED1', borderColor: '#722ED1', marginRight: '8px' }}
                      >
                        AI改写
                      </Button>
                      {generatedText && (
                        <Button
                          size="small" 
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(generatedText);
                            message.success('已复制生成结果');
                          }}
                        >
                          复制
                        </Button>
                      )}
                    </div>
                  </div>
                  <Input.TextArea
                    className="workspace-textarea workspace-textarea-generated"
                    value={generatedText}
                    onChange={handleGeneratedTextChange}
                    autoSize={{ minRows: 8, maxRows: 20 }}
                    style={{ height: '350px', fontSize: '14px' }}
                    placeholder="AI生成的完整结果将显示在这里"
                  />
                </div>
                <div className="workspace-section">
                  <div className="workspace-section-title">标题:</div>
                  <Input.TextArea
                    className="workspace-textarea workspace-textarea-title"
                    value={titleText}
                    onChange={handleTitleTextChange}
                    autoSize={{ minRows: 1, maxRows: 2 }}
                    placeholder="请输入文案标题"
                  />
                </div>
                <div className="workspace-section">
                  <div className="workspace-section-title">内容:</div>
                  <Input.TextArea
                    className="workspace-textarea workspace-textarea-content"
                    value={contentText}
                    onChange={handleContentTextChange}
                    autoSize={{ minRows: 5, maxRows: 10 }}
                    placeholder="请输入文案内容"
                  />
                </div>
                {/* 添加图片列表部分 */}
                <div className="workspace-section">
                  <div className="workspace-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>图片列表:</span>
                  </div>
                  {workspaceImages.length > 0 ? (
                    <div className="workspace-images-container">
                      {workspaceImages.map((imageUrl, index) => (
                        <div key={index} className="workspace-image-item">
                          <img
                            src={imageUrl}
                            alt={`图片 ${index + 1}`}
                            onClick={() => handleImageClick(imageUrl)}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x80?text=图片加载失败';
                              e.target.onerror = null;
                            }}
                          />
                          <Button
                            type="primary"
                            size="small"
                            danger
                            icon={<CloseOutlined />}
                            className="workspace-image-delete"
                            onClick={() => handleRemoveWorkspaceImage(index)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty 
                      description="暂无图片" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      style={{ marginTop: '8px', padding: '8px' }}
                    />
                  )}
                </div>
                <div className="workspace-actions">
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleWorkspacePush}
                  >
                    推送到小程序
                  </Button>
                </div>
              </Card>
            </div>
            
            <div className="right-section">
              <Card className="right-card">
                <div className="content-header" style={{ display: 'flex', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>{reportTitle}</Title>
                 
                </div>
                <Divider />
                <div className="right-content">
                  {apiInfo && apiInfo.report ? (
                    <div className="report-content">
                      {reportTitle === '爬取文案展示' ? (
                        <>
                          {/* 添加排序控件 */}
                          <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: '#f0f2f5', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginRight: '10px', display: 'flex', alignItems: 'center' }}>排序方式:</div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <Button
                                type={crawlSortType === 'default' ? 'primary' : 'default'}
                                onClick={() => {
                                  // 直接使用新的排序类型值而不依赖状态更新
                                  const newSortType = 'default';
                                  setCrawlSortType(newSortType);
                                  if (crawlResults.length > 0) {
                                    // 生成HTML时使用新的排序类型，而不是状态
                                    const newHTML = generateCrawlResultsHTMLWithSort(crawlResults, school, newSortType);
                                    setApiInfo(prev => ({
                                      ...prev,
                                      report: newHTML
                                    }));
                                  }
                                }}
                              >
                                默认
                              </Button>
                              <Button
                                type={crawlSortType === 'likes' ? 'primary' : 'default'}
                                onClick={() => {
                                  // 直接使用新的排序类型值而不依赖状态更新
                                  const newSortType = 'likes';
                                  setCrawlSortType(newSortType);
                                  if (crawlResults.length > 0) {
                                    // 生成HTML时使用新的排序类型，而不是状态
                                    const newHTML = generateCrawlResultsHTMLWithSort(crawlResults, school, newSortType);
                                    setApiInfo(prev => ({
                                      ...prev,
                                      report: newHTML
                                    }));
                                  }
                                }}
                                icon={<LikeOutlined />}
                              >
                                按热度排序
                              </Button>
                              <Button
                                type={crawlSortType === 'time' ? 'primary' : 'default'}
                                onClick={() => {
                                  // 直接使用新的排序类型值而不依赖状态更新
                                  const newSortType = 'time';
                                  setCrawlSortType(newSortType);
                                  if (crawlResults.length > 0) {
                                    // 生成HTML时使用新的排序类型，而不是状态
                                    const newHTML = generateCrawlResultsHTMLWithSort(crawlResults, school, newSortType);
                                    setApiInfo(prev => ({
                                      ...prev,
                                      report: newHTML
                                    }));
                                  }
                                }}
                              >
                                按时间排序 🕒
                              </Button>
                            </div>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: apiInfo.report }} />
                        </>
                      ) : (
                        <ReactMarkdown
                          components={{
                            // 自定义链接渲染，在新标签页打开
                            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                          }}
                        >
                          {apiInfo.report}
                        </ReactMarkdown>
                      )}
                    </div>
                  ) : (
                    <Text type="secondary">这里将展示报告内容</Text>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Content>

      <Modal
        title="API调用信息"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {apiInfo ? (
          <div className="api-info">
            <p><strong>调用时间:</strong>{apiInfo.timestamp}</p>
            <p><strong>状态：</strong>{apiInfo.status}</p>
            <p><strong>请求参数:</strong></p>
            <pre>{JSON.stringify(apiInfo.request, null, 2)}</pre>
            <p><strong>响应数据:</strong></p>
            <pre>{JSON.stringify(apiInfo.response, null, 2)}</pre>
          </div>
        ) : (
          <Text type="secondary">暂无API调用信息</Text>
        )}
      </Modal>
      
      {/* 历史记录模态框 */}
      <Modal
        title="历史记录"
        open={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              showSearch
              placeholder="按学校名称筛选"
              value={historyFilter.school}
              onChange={(value) => setHistoryFilter(prev => ({ ...prev, school: value }))}
              style={{ width: 200 }}
              allowClear
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {schoolOptions.map(school => (
                <Option key={school} value={school}>{school}</Option>
              ))}
            </Select>
            <Select
              placeholder="按风格筛选"
              value={historyFilter.style}
              onChange={(value) => setHistoryFilter(prev => ({ ...prev, style: value }))}
              style={{ width: 150 }}
              allowClear
            >
              {styleOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              清空记录
            </Button>
          </Space>
        </div>
        
        {getFilteredHistory().length > 0 ? (
          <List
            dataSource={getFilteredHistory()}
            renderItem={item => (
              <List.Item
                key={item.id}
                actions={[
                  <Button 
                    type="primary" 
                    icon={<RollbackOutlined />} 
                    onClick={() => restoreHistory(item)}
                  >
                    恢复
                  </Button>,
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => deleteHistory(item.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={<span>{item.school} - {item.timestamp}</span>}
                  description={`${item.contents.length}篇文案，风格${item.style}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无历史记录" />
        )}
      </Modal>
      
      {/* 图片放大查看器 */}
      {lightboxVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
          onClick={closeLightbox}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
            }}
          >
            <img
              src={lightboxImage}
              alt="放大查看"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
              onClick={(e) => e.stopPropagation()} // 防止点击图片时关闭
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=图片加载失败';
                e.target.onerror = null;
              }}
            />
            <button
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={closeLightbox}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 图片选择器弹窗 */}
      <Modal
        title="选择图片"
        open={isImageSelectorVisible}
        onCancel={() => setIsImageSelectorVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {availableImages.length > 0 ? (
            <>
              {availableImages.some(img => img.isRelated) && (
                <div style={{ marginBottom: '16px' }}>
                  <Typography.Title level={5} style={{ marginBottom: '8px' }}>与当前文案相关的图片</Typography.Title>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={availableImages.filter(img => img.isRelated)}
                    renderItem={item => (
                      <List.Item>
                        <Card
                          hoverable
                          cover={
                            <div style={{ height: 150, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8', border: '2px solid #1890ff' }}>
                              <img 
                                alt="图片" 
                                src={item.url} 
                                style={{ width: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/200x150?text=加载失败';
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                          }
                          onClick={() => handleAddImage(item.url)}
                        >
                          <Card.Meta
                            description={
                              <div>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                  {item.source}
                                </div>
                                <Button type="primary" size="small" block>
                                  选择此图片
                                </Button>
                              </div>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              )}
              
              {availableImages.some(img => !img.isRelated) && (
                <div>
                  <Typography.Title level={5} style={{ marginBottom: '8px' }}>其他可用图片</Typography.Title>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={availableImages.filter(img => !img.isRelated)}
                    renderItem={item => (
                      <List.Item>
                        <Card
                          hoverable
                          cover={
                            <div style={{ height: 150, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img 
                                alt="图片" 
                                src={item.url} 
                                style={{ width: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/200x150?text=加载失败';
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                          }
                          onClick={() => handleAddImage(item.url)}
                        >
                          <Card.Meta
                            description={
                              <div>
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                  {item.source}
                                </div>
                                <Button type="primary" size="small" block>
                                  选择此图片
                                </Button>
                              </div>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty description="没有可用的图片" />
          )}
        </div>
      </Modal>
    </Layout>
  );
}

export default App; 